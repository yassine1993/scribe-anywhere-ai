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
from .database import Base, engine, get_db
from . import models, schemas, auth, payments
from .tasks import paid_q, free_q, transcribe_job
from .utils import decrypt, encrypt_bytes
from .export_utils import export_segments

Base.metadata.create_all(bind=engine)
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Scribe Anywhere API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}))
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(HTTPSRedirectMiddleware)
app.include_router(payments.router)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("%s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response




@app.post("/auth/register", response_model=schemas.UserOut)
@limiter.limit("5/minute")
from io import BytesIO
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from zipfile import ZipFile
from typing import List, Optional
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from . import models, schemas, auth, payments
from .tasks import paid_q, free_q, transcribe_job
from .utils import decrypt
from .export_utils import export_segments
from .queue import queue
from .tasks import start_workers
from .utils import decrypt

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Scribe Anywhere API")
app.include_router(payments.router)


@app.on_event("startup")
async def startup_event():
    await start_workers(1)


@app.post("/auth/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
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
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = auth.create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/google")
async def google_oauth_callback():
    return {"message": "Google OAuth not implemented"}



UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/jobs/upload")
@limiter.limit("10/minute")
async def upload_files(files: List[UploadFile] = File(...), mode: schemas.Mode = schemas.Mode.dolphin,
async def upload_files(files: List[UploadFile] = File(...), mode: str = "dolphin",
                       language: Optional[str] = None, target_language: Optional[str] = None,
                       restore_audio: bool = False, speaker_recognition: bool = False,
                       current_user: models.User = Depends(auth.get_current_user),
                       db: Session = Depends(get_db)):
    user = current_user
    limit = 100 if user.is_paid else 10
    if user.usage_count + len(files) > limit:
        raise HTTPException(status_code=403, detail="Usage limit exceeded")
    job_ids = []
    for file in files:
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large")
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in {".mp3", ".wav", ".m4a", ".mp4", ".flac", ".aac", ".ogg"}:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        enc_path = os.path.join(UPLOAD_DIR, file.filename + ".enc")
        with open(enc_path, "wb") as f:
            f.write(encrypt_bytes(contents))
        db_job = models.TranscriptionJob(user_id=user.id, filename=file.filename, mode=mode.value,
        path = os.path.join(UPLOAD_DIR, file.filename)
        with open(path, "wb") as f:
            f.write(contents)
        db_job = models.TranscriptionJob(user_id=user.id, filename=file.filename, mode=mode,
                                         language=language, target_language=target_language,
                                         restore_audio=restore_audio, speaker_recognition=speaker_recognition)
        db.add(db_job)
        db.commit()
        db.refresh(db_job)
        queue = paid_q if user.is_paid else free_q
        queue.enqueue(transcribe_job, db_job.id, enc_path, mode.value, language, target_language, restore_audio, speaker_recognition)
        queue.enqueue(transcribe_job, db_job.id, path, mode, language, target_language, restore_audio, speaker_recognition)
        job_ids.append(db_job.id)
        user.usage_count += 1
        db.commit()
    return {"job_ids": job_ids}


@app.get("/jobs/{job_id}", response_model=schemas.JobStatus)
@limiter.limit("30/minute")
async def upload_file(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    user = current_user
    limit = 100 if user.is_paid else 10
    if user.usage_count >= limit:
        raise HTTPException(status_code=403, detail="Usage limit exceeded")
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as f:
        f.write(contents)
    priority = 1 if user.is_paid else 10
    job_id = await queue.add_job(priority, {"user_id": user.id, "file_path": path, "filename": file.filename})
    db_job = models.TranscriptionJob(id=job_id, user_id=user.id, filename=file.filename)
    db.add(db_job)
    user.usage_count += 1
    db.commit()
    return {"job_id": job_id}


@app.get("/jobs/{job_id}", response_model=schemas.JobStatus)
async def get_status(job_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    status_info = queue.get_status(job_id)
    job.status = status_info.get("status", job.status)
    if status_info.get("transcript") and not job.transcript_encrypted:
        job.transcript_encrypted = status_info["transcript"]
        db.commit()
    return job


@app.get("/jobs/{job_id}/transcript")
@limiter.limit("20/minute")

async def get_transcript(job_id: int, format: str = "txt", current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job or job.status != "completed" or not job.transcript_encrypted:
        raise HTTPException(status_code=404, detail="Transcript not available")
    data = decrypt(job.transcript_encrypted)
    if format == "json":
        return json.loads(data)
    segments = json.loads(data)["segments"]
    try:
        buf, media, ext = export_segments(segments, format)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format not supported")
    filename = f"{job.filename}.{ext}"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return StreamingResponse(buf, media_type=media, headers=headers)


@app.post("/jobs/export")
@limiter.limit("5/minute")
async def bulk_export(req: schemas.BulkExportRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(models.TranscriptionJob).filter(models.TranscriptionJob.id.in_(req.job_ids), models.TranscriptionJob.user_id == current_user.id, models.TranscriptionJob.status == "completed").all()
    if not jobs:
        raise HTTPException(status_code=404, detail="No transcripts found")
    mem = BytesIO()
    with ZipFile(mem, "w") as zf:
        for job in jobs:
            if not job.transcript_encrypted:
                continue
            segments = json.loads(decrypt(job.transcript_encrypted))["segments"]
            try:
                buf, _, ext = export_segments(segments, req.format)
            except ValueError:
                raise HTTPException(status_code=400, detail="Format not supported")
            zf.writestr(f"{job.filename}.{ext}", buf.getvalue())
    mem.seek(0)
    headers = {"Content-Disposition": "attachment; filename=transcripts.zip"}
    return StreamingResponse(mem, media_type="application/zip", headers=headers)


@app.delete("/jobs/{job_id}", status_code=204)
@limiter.limit("5/minute")
async def delete_job(job_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    enc_path = os.path.join(UPLOAD_DIR, job.filename + ".enc")
    if os.path.exists(enc_path):
        os.remove(enc_path)
    db.delete(job)
    db.commit()
    return Response(status_code=204)
    if format == "txt":
        segments = json.loads(data)["segments"]
        text = "\n".join(seg["text"] for seg in segments)
        return {"text": text}
    elif format == "json":
        return json.loads(data)
    text = decrypt(job.transcript_encrypted)
    if format == "txt":
        return {"text": text}
    elif format == "json":
        return {"transcript": text}
    else:
        raise HTTPException(status_code=400, detail="Format not supported in demo")
