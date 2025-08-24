from cryptography.fernet import Fernet
from .config import settings

fernet = Fernet(settings.fernet_key.encode())
_key = Fernet.generate_key()
fernet = Fernet(_key)


def encrypt(text: str) -> str:
    return fernet.encrypt(text.encode()).decode()


def decrypt(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()


def encrypt_bytes(data: bytes) -> bytes:
    return fernet.encrypt(data)


def decrypt_bytes(token: bytes) -> bytes:
    return fernet.decrypt(token)
