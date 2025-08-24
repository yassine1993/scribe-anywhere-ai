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
