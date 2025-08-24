#!/usr/bin/env python3
"""
TranscribeAI Background Worker

This worker processes transcription jobs from Redis queues.
It handles both paid (high priority) and free (low priority) jobs.
"""

import os
import sys
import time
import logging
from redis import Redis
from rq import Worker, Queue, Connection
from rq.worker import HerokuWorker as Worker
from .config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_worker():
    """Start the background worker process"""
    try:
        # Connect to Redis
        redis_conn = Redis.from_url(settings.redis_url)
        logger.info("Connected to Redis")
        
        # Create queues
        paid_queue = Queue("paid", connection=redis_conn)
        free_queue = Queue("free", connection=redis_conn)
        
        logger.info("Created Redis queues: paid (high priority), free (low priority)")
        
        # Start worker with both queues
        with Connection(redis_conn):
            worker = Worker([paid_queue, free_queue])
            logger.info(f"Starting worker {worker.name}")
            logger.info(f"Listening to queues: {[q.name for q in worker.queues]}")
            
            # Start the worker
            worker.work(
                logging_level=logging.INFO,
                max_jobs=10,  # Process up to 10 jobs before restarting
                job_timeout=3600,  # 1 hour timeout per job
                result_ttl=86400,  # Keep results for 24 hours
                worker_ttl=300,  # Worker timeout after 5 minutes of inactivity
            )
            
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        sys.exit(1)

def start_workers(num_workers: int = 1):
    """Start multiple worker processes"""
    logger.info(f"Starting {num_workers} worker process(es)")
    
    if num_workers == 1:
        start_worker()
    else:
        # For multiple workers, you might want to use multiprocessing
        # or run multiple instances of this script
        logger.warning("Multiple workers not implemented yet. Starting single worker.")
        start_worker()

if __name__ == "__main__":
    # Get number of workers from command line argument
    num_workers = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    start_workers(num_workers)
