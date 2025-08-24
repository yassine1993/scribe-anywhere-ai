import json
import os
import logging
from typing import Optional
from redis import Redis
from rq import Queue
from faster_whisper import WhisperModel
import torch
from googletrans import Translator, LANGUAGES
from pydub import AudioSegment, effects

# Optional speaker diarization
try:
    from pyannote.audio import Pipeline
    diarization_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization")
    SPEAKER_RECOGNITION_AVAILABLE = True
except Exception as e:
    logging.warning(f"Speaker recognition not available: {e}")
    diarization_pipeline = None
    SPEAKER_RECOGNITION_AVAILABLE = False

from .config import settings
from .database import SessionLocal
from .models import TranscriptionJob
from .utils import encrypt, decrypt_bytes

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcription")

# Redis connection and queues
redis_conn = Redis.from_url(settings.redis_url)
paid_q = Queue("paid", connection=redis_conn)
free_q = Queue("free", connection=redis_conn)

# Model configurations for different processing modes
MODEL_SIZES = {
    "cheetah": "tiny",      # Fastest, ~95% accuracy
    "dolphin": "base",      # Balanced, ~98% accuracy  
    "whale": "large"        # Most accurate, ~99.8% accuracy
}

# Initialize translator
translator = Translator()

# Model cache to avoid reloading
MODEL_CACHE: dict[str, WhisperModel] = {}

def get_model(mode: str) -> WhisperModel:
    """Lazily load Whisper models on first use and reuse them across jobs."""
    size = MODEL_SIZES.get(mode.lower(), "base")
    
    if size not in MODEL_CACHE:
        logger.info(f"Loading Whisper model: {size}")
        MODEL_CACHE[size] = WhisperModel(
            size,
            device="cuda" if torch.cuda.is_available() else "cpu",
            compute_type="float16" if torch.cuda.is_available() else "int8",
        )
        logger.info(f"Model {size} loaded successfully")
    
    return MODEL_CACHE[size]

def restore_audio(file_path: str) -> str:
    """Apply audio restoration to improve transcription quality."""
    try:
        audio = AudioSegment.from_file(file_path)
        # Normalize audio levels
        normalized = effects.normalize(audio)
        
        # Apply additional restoration if needed
        # You can add more audio processing here (noise reduction, etc.)
        
        restored_path = file_path + ".restored.wav"
        normalized.export(restored_path, format="wav")
        logger.info(f"Audio restored and saved to: {restored_path}")
        return restored_path
    except Exception as e:
        logger.error(f"Audio restoration failed: {e}")
        return file_path

def recognize_speakers(audio_path: str, segments) -> list:
    """Apply speaker diarization to identify different speakers."""
    if not SPEAKER_RECOGNITION_AVAILABLE:
        logger.warning("Speaker recognition not available")
        return [{"start": seg.start, "end": seg.end, "speaker": "Speaker 1", "text": seg.text} for seg in segments]
    
    try:
        logger.info("Starting speaker recognition...")
        diarization = diarization_pipeline(audio_path)
        
        # Map segments to speakers
        result_segments = []
        for seg in segments:
            speaker = "Speaker 1"  # Default speaker
            
            # Find which speaker segment this transcription segment belongs to
            for turn, _, label in diarization.itertracks(yield_label=True):
                if seg.start >= turn.start and seg.end <= turn.end:
                    speaker = f"Speaker {label}"
                    break
            
            result_segments.append({
                "start": seg.start,
                "end": seg.end,
                "speaker": speaker,
                "text": seg.text
            })
        
        logger.info(f"Speaker recognition completed for {len(result_segments)} segments")
        return result_segments
        
    except Exception as e:
        logger.error(f"Speaker recognition failed: {e}")
        # Fallback to single speaker
        return [{"start": seg.start, "end": seg.end, "speaker": "Speaker 1", "text": seg.text} for seg in segments]

def transcribe_job(
    job_id: int,
    encrypted_file_path: str,
    mode: str = "dolphin",
    language: Optional[str] = None,
    target_language: Optional[str] = None,
    restore_audio: bool = False,
    speaker_recognition: bool = False
) -> None:
    """
    Main transcription job function that processes audio/video files.
    
    Args:
        job_id: Database ID of the transcription job
        encrypted_file_path: Path to the encrypted audio/video file
        mode: Processing mode (cheetah/dolphin/whale)
        language: Source language for transcription
        target_language: Target language for translation
        restore_audio: Whether to apply audio restoration
        speaker_recognition: Whether to identify different speakers
    """
    logger.info(f"Starting transcription job {job_id} with mode: {mode}")
    
    try:
        # Get database session
        db = SessionLocal()
        job = db.query(TranscriptionJob).get(job_id)
        
        if not job:
            logger.error(f"Job {job_id} not found in database")
            return
        
        # Update job status
        job.status = "processing"
        db.commit()
        
        # Decrypt the file
        logger.info(f"Decrypting file: {encrypted_file_path}")
        with open(encrypted_file_path, "rb") as f:
            encrypted_data = f.read()
        
        decrypted_data = decrypt_bytes(encrypted_data)
        
        # Create temporary file for processing
        temp_path = encrypted_file_path.replace(".enc", ".temp")
        with open(temp_path, "wb") as f:
            f.write(decrypted_data)
        
        # Apply audio restoration if requested
        if restore_audio:
            logger.info("Applying audio restoration...")
            processed_path = restore_audio(temp_path)
        else:
            processed_path = temp_path
        
        # Get the appropriate Whisper model
        model = get_model(mode)
        logger.info(f"Using Whisper model: {MODEL_SIZES[mode]}")
        
        # Determine task type
        task = "translate" if target_language else "transcribe"
        logger.info(f"Task: {task}")
        
        # Perform transcription
        logger.info("Starting transcription...")
        segments, info = model.transcribe(
            processed_path,
            language=language,
            task=task,
            beam_size=5 if mode == "whale" else 1,  # Higher beam size for accuracy
            best_of=5 if mode == "whale" else 1     # Higher best_of for accuracy
        )
        
        # Convert segments to list for processing
        segments_list = list(segments)
        logger.info(f"Transcription completed. {len(segments_list)} segments generated.")
        
        # Apply speaker recognition if requested
        if speaker_recognition:
            logger.info("Applying speaker recognition...")
            result_segments = recognize_speakers(processed_path, segments_list)
        else:
            result_segments = [
                {"start": seg.start, "end": seg.end, "speaker": "Speaker 1", "text": seg.text}
                for seg in segments_list
            ]
        
        # Apply translation if target language specified
        if target_language:
            logger.info(f"Translating to {target_language}...")
            try:
                for seg in result_segments:
                    translated = translator.translate(seg["text"], dest=target_language.lower())
                    seg["text"] = translated.text
                    seg["original_text"] = seg["text"]  # Keep original for reference
                logger.info("Translation completed")
            except Exception as e:
                logger.error(f"Translation failed: {e}")
                # Continue with original text if translation fails
        
        # Create final transcript
        transcript_data = {
            "segments": result_segments,
            "metadata": {
                "mode": mode,
                "language": language,
                "target_language": target_language,
                "restore_audio": restore_audio,
                "speaker_recognition": speaker_recognition,
                "model_info": info,
                "processing_time": None  # Could add timing info here
            }
        }
        
        # Encrypt and save transcript
        transcript_json = json.dumps(transcript_data, ensure_ascii=False)
        encrypted_transcript = encrypt(transcript_json)
        
        # Update job in database
        job.status = "completed"
        job.transcript_encrypted = encrypted_transcript
        db.commit()
        
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {e}")
        
        # Update job status to failed
        try:
            if 'db' in locals() and db:
                job = db.query(TranscriptionJob).get(job_id)
                if job:
                    job.status = "failed"
                    db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update job status: {db_error}")
    
    finally:
        # Cleanup temporary files
        try:
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            if 'processed_path' in locals() and processed_path != temp_path and os.path.exists(processed_path):
                os.remove(processed_path)
        except Exception as cleanup_error:
            logger.error(f"Cleanup failed: {cleanup_error}")
        
        # Close database connection
        if 'db' in locals():
            db.close()
