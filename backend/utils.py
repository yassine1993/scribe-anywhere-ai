from cryptography.fernet import Fernet
from .config import settings

_key = Fernet.generate_key()
fernet = Fernet(_key)


def encrypt(text: str) -> str:
    return fernet.encrypt(text.encode()).decode()


def decrypt(token: str) -> str:
    return fernet.decrypt(token.encode()).decode()
