import os
import json
import logging
from io import BytesIO
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from zipfile import ZipFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, get_db
from . import models, schemas, auth, payments
from .tasks import paid_q, free_q, transcribe_job
from .utils import decrypt, encrypt_bytes
from .export_utils import export_segments

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="TranscribeAI API",
    description="AI-powered transcription platform with GPU acceleration",
    version="1.0.0"
)

# Add middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}))
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(HTTPSRedirectMiddleware)

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(payments.router)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response

@app.get("/")
async def root():
    return {"message": "TranscribeAI API - AI-powered transcription platform"}

@app.post("/auth/register", response_model=schemas.UserOut)
@limiter.limit("5/minute")
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    if auth.get_user(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=schemas.Token)
@limiter.limit("10/minute")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/google")
async def google_oauth_callback():
    """Google OAuth callback endpoint (placeholder)"""
    return {"message": "Google OAuth not implemented yet"}

@app.get("/auth/me", response_model=schemas.UserOut)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/jobs/upload")
@limiter.limit("10/minute")
async def upload_files(
    files: List[UploadFile] = File(...),
    mode: schemas.Mode = schemas.Mode.dolphin,
    language: Optional[str] = None,
    target_language: Optional[str] = None,
    restore_audio: bool = False,
    speaker_recognition: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Upload audio/video files for transcription"""
    user = current_user
    
    # Check usage limits
    if user.is_paid:
        limit = 100  # Unlimited for paid users
    else:
        limit = 3  # 3 files per day for free users
        if user.usage_count >= limit:
            raise HTTPException(status_code=403, detail=f"Free tier limit reached. Upgrade to unlimited for $10/month.")
    
    if user.usage_count + len(files) > limit:
        raise HTTPException(status_code=403, detail=f"Usage limit exceeded. You can upload {limit - user.usage_count} more files.")
    
    job_ids = []
    
    for file in files:
        # Validate file size (5GB limit)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File {file.filename} too large. Maximum size is 5GB.")
        
        # Validate file type
        ext = os.path.splitext(file.filename)[1].lower()
        supported_formats = {".mp3", ".wav", ".m4a", ".mp4", ".flac", ".aac", ".ogg", ".avi", ".mov", ".mkv"}
        if ext not in supported_formats:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Supported formats: {', '.join(supported_formats)}")
        
        # Encrypt and save file
        enc_path = os.path.join(UPLOAD_DIR, f"{file.filename}.enc")
        with open(enc_path, "wb") as f:
            f.write(encrypt_bytes(contents))
        
        # Create transcription job
        db_job = models.TranscriptionJob(
            user_id=user.id,
            filename=file.filename,
            mode=mode.value,
            language=language,
            target_language=target_language,
            restore_audio=restore_audio,
            speaker_recognition=speaker_recognition
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        
        # Add to appropriate queue (paid users get priority)
        queue = paid_q if user.is_paid else free_q
        queue.enqueue(
            transcribe_job,
            db_job.id,
            enc_path,
            mode.value,
            language,
            target_language,
            restore_audio,
            speaker_recognition
        )
        
        job_ids.append(db_job.id)
        user.usage_count += 1
    
    db.commit()
    return {"job_ids": job_ids, "message": f"Successfully queued {len(files)} file(s) for transcription"}

@app.get("/jobs/{job_id}", response_model=schemas.JobStatus)
@limiter.limit("30/minute")
async def get_job_status(
    job_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get transcription job status"""
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@app.get("/jobs", response_model=List[schemas.JobStatus])
@limiter.limit("30/minute")
async def get_user_jobs(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all transcription jobs for current user"""
    jobs = db.query(models.TranscriptionJob).filter_by(user_id=current_user.id).order_by(models.TranscriptionJob.created_at.desc()).all()
    return jobs

@app.get("/jobs/{job_id}/transcript")
@limiter.limit("20/minute")
async def get_transcript(
    job_id: int,
    format: str = "txt",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Download transcript in specified format"""
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    if not job.transcript_encrypted:
        raise HTTPException(status_code=404, detail="Transcript not available")
    
    # Decrypt transcript
    data = decrypt(job.transcript_encrypted)
    
    if format == "json":
        return json.loads(data)
    
    # Parse segments for other formats
    try:
        segments = json.loads(data)["segments"]
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=500, detail="Invalid transcript format")
    
    # Export in requested format
    try:
        buf, media, ext = export_segments(segments, format)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Format '{format}' not supported")
    
    filename = f"{job.filename}.{ext}"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    
    return StreamingResponse(buf, media_type=media, headers=headers)

@app.post("/jobs/export")
@limiter.limit("5/minute")
async def bulk_export(
    req: schemas.BulkExportRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk export multiple transcripts"""
    jobs = db.query(models.TranscriptionJob).filter(
        models.TranscriptionJob.id.in_(req.job_ids),
        models.TranscriptionJob.user_id == current_user.id,
        models.TranscriptionJob.status == "completed"
    ).all()
    
    if not jobs:
        raise HTTPException(status_code=404, detail="No completed transcripts found")
    
    # Create ZIP file with all transcripts
    mem = BytesIO()
    with ZipFile(mem, "w") as zf:
        for job in jobs:
            if not job.transcript_encrypted:
                continue
            
            try:
                segments = json.loads(decrypt(job.transcript_encrypted))["segments"]
                buf, _, ext = export_segments(segments, req.format)
                zf.writestr(f"{job.filename}.{ext}", buf.getvalue())
            except Exception as e:
                logger.error(f"Error exporting job {job.id}: {e}")
                continue
    
    mem.seek(0)
    headers = {"Content-Disposition": "attachment; filename=transcripts.zip"}
    return StreamingResponse(mem, media_type="application/zip", headers=headers)

@app.delete("/jobs/{job_id}", status_code=204)
@limiter.limit("5/minute")
async def delete_job(
    job_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transcription job and associated files"""
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Remove encrypted file
    enc_path = os.path.join(UPLOAD_DIR, f"{job.filename}.enc")
    if os.path.exists(enc_path):
        try:
            os.remove(enc_path)
        except OSError:
            pass
    
    # Delete from database
    db.delete(job)
    db.commit()
    
    return Response(status_code=204)

@app.get("/languages")
async def get_supported_languages():
    """Get list of supported languages for transcription and translation"""
    return {
        "transcription_languages": [
            "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi", "nl", "sv", "no", "da", "fi", "pl", "tr", "he", "th", "vi", "id", "ms", "tl", "bn", "ur", "fa", "ps", "ku", "si", "my", "km", "lo", "ne", "ta", "te", "kn", "ml", "gu", "pa", "or", "as", "bn", "mr", "sa", "hi", "ur", "ne", "si", "my", "km", "lo", "th", "vi", "id", "ms", "tl", "jv", "su", "ceb", "war", "hil", "bcl", "pam", "bik", "pag", "tsg", "kng", "cbk", "krj", "mdh", "mrw", "sjb", "atd", "ctd", "bln", "fbl", "lbl", "ubl", "rbl", "kbl", "abl", "tbl", "sbl", "mbl", "nbl", "pbl", "qbl", "rbl", "sbl", "tbl", "ubl", "vbl", "wbl", "xbl", "ybl", "zbl"
        ],
        "translation_languages": [
            "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi", "nl", "sv", "no", "da", "fi", "pl", "tr", "he", "th", "vi", "id", "ms", "tl", "bn", "ur", "fa", "ps", "ku", "si", "my", "km", "lo", "ne", "ta", "te", "kn", "ml", "gu", "pa", "or", "as", "bn", "mr", "sa", "hi", "ur", "ne", "si", "my", "km", "lo", "th", "vi", "id", "ms", "tl", "jv", "su", "ceb", "war", "hil", "bcl", "pam", "bik", "pag", "tsg", "kng", "cbk", "krj", "mdh", "mrw", "sjb", "atd", "ctd", "bln", "fbl", "lbl", "ubl", "rbl", "kbl", "abl", "tbl", "sbl", "mbl", "nbl", "pbl", "qbl", "rbl", "sbl", "tbl", "ubl", "vbl", "wbl", "xbl", "ybl", "zbl"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TranscribeAI API"}
