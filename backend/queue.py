import asyncio
from typing import Dict


class JobQueue:
    def __init__(self):
        self._queue = asyncio.PriorityQueue()
        self.jobs: Dict[int, dict] = {}
        self._counter = 0

    async def add_job(self, priority: int, job: dict) -> int:
        self._counter += 1
        job_id = self._counter
        job["id"] = job_id
        job["status"] = "queued"
        self.jobs[job_id] = job
        await self._queue.put((priority, job_id))
        return job_id

    async def get_job(self):
        priority, job_id = await self._queue.get()
        job = self.jobs[job_id]
        job["status"] = "processing"
        return job

    def update_job(self, job_id: int, **kwargs):
        if job_id in self.jobs:
            self.jobs[job_id].update(**kwargs)

    def get_status(self, job_id: int) -> dict:
        return self.jobs.get(job_id, {})


queue = JobQueue()
