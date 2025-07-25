import base64
import hashlib
import secrets
from typing import Optional, Tuple

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from ..utils.config import SecurityConfig
from ..utils.logging import LoggerMixin


class PasswordManager(LoggerMixin):
    def __init__(self, config: SecurityConfig):
        self.config = config
        self._fernet = self._initialize_encryption()
    
    def _initialize_encryption(self) -> Fernet:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.config.password_salt.encode(),
            iterations=100000,
        )

        key = base64.urlsafe_b64encode(
            kdf.derive(self.config.encryption_key.encode())
        )

        return Fernet(key)
    
    def generate_password(self, base_password: str, sequence_id: int) -> str:
        password = f"{base_password}{sequence_id}"

        random_suffix = secrets.token_urlsafe(4)
        password = f"{password}{random_suffix}"

        self.logger.debug("Password generated", sequence_id=sequence_id)
        return password
    
    def encrypt_password(self, password: str) -> str:
        try:
            encrypted_bytes = self._fernet.encrypt(password.encode())
            encrypted_b64 = base64.urlsafe_b64encode(encrypted_bytes).decode()
            
            self.logger.debug("Password encrypted successfully")
            return encrypted_b64
            
        except Exception as e:
            self.logger.error("Password encryption failed", error=str(e))
            raise
    
    def decrypt_password(self, encrypted_password: str) -> str:
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_password.encode())
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            password = decrypted_bytes.decode()
            
            self.logger.debug("Password decrypted successfully")
            return password
            
        except Exception as e:
            self.logger.error("Password decryption failed", error=str(e))
            raise
    
    def hash_password(self, password: str) -> str:
        salt = self.config.password_salt.encode()
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt,
            100000
        )
        
        return base64.urlsafe_b64encode(password_hash).decode()
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        try:
            computed_hash = self.hash_password(password)
            return secrets.compare_digest(computed_hash, password_hash)
        except Exception as e:
            self.logger.error("Password verification failed", error=str(e))
            return False
    
    def generate_secure_password(
        self,
        length: int = 16,
        include_uppercase: bool = True,
        include_lowercase: bool = True,
        include_digits: bool = True,
        include_symbols: bool = True
    ) -> str:
        characters = ""
        
        if include_lowercase:
            characters += "abcdefghijklmnopqrstuvwxyz"
        if include_uppercase:
            characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if include_digits:
            characters += "0123456789"
        if include_symbols:
            characters += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        if not characters:
            raise ValueError("At least one character type must be included")
        
        password = []
        
        if include_lowercase:
            password.append(secrets.choice("abcdefghijklmnopqrstuvwxyz"))
        if include_uppercase:
            password.append(secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))
        if include_digits:
            password.append(secrets.choice("0123456789"))
        if include_symbols:
            password.append(secrets.choice("!@#$%^&*()_+-=[]{}|;:,.<>?"))
        
        for _ in range(length - len(password)):
            password.append(secrets.choice(characters))
        
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    def generate_recovery_email(self, base_email: str, sequence_id: int) -> str:
        if '@' in base_email:
            local_part, domain = base_email.split('@', 1)
            recovery_email = f"{local_part}.recovery{sequence_id}@{domain}"
        else:
            recovery_email = f"{base_email}.recovery{sequence_id}@gmail.com"
        
        self.logger.debug("Recovery email generated", sequence_id=sequence_id)
        return recovery_email


class SecureStorage:
    def __init__(self, password_manager: PasswordManager):
        self.password_manager = password_manager
    
    def store_proxy_credentials(self, username: str, password: str) -> str:
        credentials = f"{username}:{password}"
        return self.password_manager.encrypt_password(credentials)
    
    def retrieve_proxy_credentials(self, encrypted_credentials: str) -> Tuple[str, str]:
        credentials = self.password_manager.decrypt_password(encrypted_credentials)
        if ':' in credentials:
            username, password = credentials.split(':', 1)
            return username, password
        return credentials, ""
    
    def store_api_key(self, api_key: str) -> str:
        return self.password_manager.encrypt_password(api_key)
    
    def retrieve_api_key(self, encrypted_api_key: str) -> str:
        return self.password_manager.decrypt_password(encrypted_api_key)
