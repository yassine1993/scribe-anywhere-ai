import json
import os
from typing import Optional
from redis import Redis
from rq import Queue
from faster_whisper import WhisperModel
import torch
from googletrans import Translator, LANGUAGES
from pydub import AudioSegment, effects
try:
    from pyannote.audio import Pipeline
    diarization_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")
except Exception:  # pragma: no cover - optional dependency
    diarization_pipeline = None
from .config import settings
from .database import SessionLocal
from .models import TranscriptionJob
from .utils import encrypt, decrypt_bytes
from .utils import encrypt

redis_conn = Redis.from_url(settings.redis_url)
paid_q = Queue("paid", connection=redis_conn)
free_q = Queue("free", connection=redis_conn)

MODEL_SIZES = {
    "cheetah": "tiny",
    "dolphin": "base",
    "whale": "large"
}

translator = Translator()
MODEL_CACHE: dict[str, WhisperModel] = {}


def get_model(mode: str) -> WhisperModel:
    """Lazily load Whisper models on first use and reuse them across jobs."""
    size = MODEL_SIZES.get(mode.lower(), "base")
    if size not in MODEL_CACHE:
        MODEL_CACHE[size] = WhisperModel(
            size,
            device="cuda" if torch.cuda.is_available() else "cpu",
            compute_type="float16" if torch.cuda.is_available() else "int8",
        )
    return MODEL_CACHE[size]

def restore_audio(path: str) -> str:
    audio = AudioSegment.from_file(path)
    normalized = effects.normalize(audio)
    restored_path = path + ".restored.wav"
    normalized.export(restored_path, format="wav")
    return restored_path


def transcribe_job(job_id: int, file_path: str, mode: str = "dolphin", language: Optional[str] = None,
                   target_language: Optional[str] = None, restore: bool = False,
                   recognize_speakers: bool = False) -> None:
    model = get_model(mode)
    tmp_path = file_path.replace(".enc", "")
    with open(file_path, "rb") as f:
        decrypted = decrypt_bytes(f.read())
    with open(tmp_path, "wb") as f:
        f.write(decrypted)
    audio_path = restore_audio(tmp_path) if restore else tmp_path
    audio_path = restore_audio(file_path) if restore else file_path
    task = "translate" if target_language else "transcribe"
    segments, _ = model.transcribe(audio_path, language=language, task=task)
    diarization = diarization_pipeline(audio_path) if recognize_speakers and diarization_pipeline else None
    result_segments = []
    for seg in segments:
        text = seg.text
        if target_language:
            code = target_language.lower()
            if code not in LANGUAGES:
                raise ValueError(f"Unsupported target language: {target_language}")
            text = translator.translate(text, dest=code).text
        speaker = "Speaker 1"
        if diarization:
            for turn, _, label in diarization.itertracks(yield_label=True):
                if seg.start >= turn.start and seg.end <= turn.end:
                    speaker = label
                    break
        result_segments.append({"start": seg.start, "end": seg.end, "speaker": speaker, "text": text})
    transcript_json = json.dumps({"segments": result_segments})
    db = SessionLocal()
    job = db.query(TranscriptionJob).get(job_id)
    if job:
        job.status = "completed"
        job.transcript_encrypted = encrypt(transcript_json)
        db.commit()
    db.close()
    if restore and audio_path != tmp_path:
        try:
            os.remove(audio_path)
        except OSError:
            pass
    try:
        os.remove(tmp_path)
    except OSError:
        pass
import asyncio
from .queue import queue
from .utils import encrypt


async def transcribe_audio(file_path: str) -> str:
    # Placeholder transcription logic
    await asyncio.sleep(1)
    return f"Transcription for {file_path}"


async def worker():
    while True:
        job = await queue.get_job()
        transcript = await transcribe_audio(job["file_path"])
        encrypted = encrypt(transcript)
        queue.update_job(job["id"], status="completed", transcript=encrypted)


async def start_workers(n: int = 1):
    for _ in range(n):
        asyncio.create_task(worker())
