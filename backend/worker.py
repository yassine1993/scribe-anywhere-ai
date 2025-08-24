from rq import Worker, Queue, Connection
from redis import Redis
from .config import settings

listen = ["paid", "free"]
conn = Redis.from_url(settings.redis_url)

if __name__ == "__main__":
    with Connection(conn):
        worker = Worker(list(map(Queue, listen)))
        worker.work()
