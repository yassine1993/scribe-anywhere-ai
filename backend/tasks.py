import json
from typing import Optional
from redis import Redis
from rq import Queue
from faster_whisper import WhisperModel
import torch
from googletrans import Translator
from pydub import AudioSegment, effects
try:
    from pyannote.audio import Pipeline
    diarization_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")
except Exception:  # pragma: no cover - optional dependency
    diarization_pipeline = None
from .config import settings
from .database import SessionLocal
from .models import TranscriptionJob
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

def restore_audio(path: str) -> str:
    audio = AudioSegment.from_file(path)
    normalized = effects.normalize(audio)
    restored_path = path + ".restored.wav"
    normalized.export(restored_path, format="wav")
    return restored_path


def transcribe_job(job_id: int, file_path: str, mode: str = "dolphin", language: Optional[str] = None,
                   target_language: Optional[str] = None, restore: bool = False,
                   recognize_speakers: bool = False) -> None:
    model_size = MODEL_SIZES.get(mode.lower(), "base")
    model = WhisperModel(model_size, device="cuda" if torch.cuda.is_available() else "cpu")
    audio_path = restore_audio(file_path) if restore else file_path
    segments, _ = model.transcribe(audio_path, language=language, task="translate" if target_language else "transcribe")
    diarization = diarization_pipeline(audio_path) if recognize_speakers and diarization_pipeline else None
    result_segments = []
    for seg in segments:
        text = seg.text
        if target_language:
            text = translator.translate(text, dest=target_language).text
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
