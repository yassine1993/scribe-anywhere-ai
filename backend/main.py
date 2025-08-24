import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from . import models, schemas, auth, payments
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
async def get_transcript(job_id: int, format: str = "txt", current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job or job.status != "completed" or not job.transcript_encrypted:
        raise HTTPException(status_code=404, detail="Transcript not available")
    text = decrypt(job.transcript_encrypted)
    if format == "txt":
        return {"text": text}
    elif format == "json":
        return {"transcript": text}
    else:
        raise HTTPException(status_code=400, detail="Format not supported in demo")
