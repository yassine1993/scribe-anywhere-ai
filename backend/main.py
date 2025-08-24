import os
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from . import models, schemas, auth, payments
from .tasks import paid_q, free_q, transcribe_job
from .utils import decrypt

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Scribe Anywhere API")
app.include_router(payments.router)




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
        queue.enqueue(transcribe_job, db_job.id, path, mode, language, target_language, restore_audio, speaker_recognition)
        job_ids.append(db_job.id)
        user.usage_count += 1
        db.commit()
    return {"job_ids": job_ids}


@app.get("/jobs/{job_id}", response_model=schemas.JobStatus)
async def get_status(job_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/jobs/{job_id}/transcript")
async def get_transcript(job_id: int, format: str = "txt", current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    job = db.query(models.TranscriptionJob).filter_by(id=job_id, user_id=current_user.id).first()
    if not job or job.status != "completed" or not job.transcript_encrypted:
        raise HTTPException(status_code=404, detail="Transcript not available")
    data = decrypt(job.transcript_encrypted)
    if format == "txt":
        segments = json.loads(data)["segments"]
        text = "\n".join(seg["text"] for seg in segments)
        return {"text": text}
    elif format == "json":
        return json.loads(data)
    else:
        raise HTTPException(status_code=400, detail="Format not supported in demo")
