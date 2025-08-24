from datetime import datetime
from typing import Optional, List
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_paid: bool

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class JobCreate(BaseModel):
    filename: str


class JobStatus(BaseModel):
    id: int
    status: str
    created_at: datetime
    mode: str
    language: Optional[str] = None
    target_language: Optional[str] = None
    restore_audio: bool
    speaker_recognition: bool

    class Config:
        orm_mode = True


class BulkExportRequest(BaseModel):
    job_ids: List[int]
    format: str
