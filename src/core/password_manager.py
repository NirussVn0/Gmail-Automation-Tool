"""Secure password management with AES-256 encryption."""

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
    """Secure password manager with AES-256 encryption."""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self._fernet = self._initialize_encryption()
    
    def _initialize_encryption(self) -> Fernet:
        """Initialize Fernet encryption with derived key."""
        # Derive encryption key from config using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.config.password_salt.encode(),
            iterations=100000,  # OWASP recommended minimum
        )
        
        key = base64.urlsafe_b64encode(
            kdf.derive(self.config.encryption_key.encode())
        )
        
        return Fernet(key)
    
    def generate_password(self, base_password: str, sequence_id: int) -> str:
        """Generate a password using base password and sequence ID."""
        password = f"{base_password}{sequence_id}"
        
        # Add some randomness to make passwords more secure
        random_suffix = secrets.token_urlsafe(4)
        password = f"{password}{random_suffix}"
        
        self.logger.debug("Password generated", sequence_id=sequence_id)
        return password
    
    def encrypt_password(self, password: str) -> str:
        """Encrypt a password using AES-256."""
        try:
            encrypted_bytes = self._fernet.encrypt(password.encode())
            encrypted_b64 = base64.urlsafe_b64encode(encrypted_bytes).decode()
            
            self.logger.debug("Password encrypted successfully")
            return encrypted_b64
            
        except Exception as e:
            self.logger.error("Password encryption failed", error=str(e))
            raise
    
    def decrypt_password(self, encrypted_password: str) -> str:
        """Decrypt an encrypted password."""
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
        """Create a secure hash of a password for verification."""
        # Use SHA-256 with salt for password hashing
        salt = self.config.password_salt.encode()
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode(),
            salt,
            100000  # iterations
        )
        
        return base64.urlsafe_b64encode(password_hash).decode()
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its hash."""
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
        """Generate a cryptographically secure random password."""
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
        
        # Ensure at least one character from each selected type
        password = []
        
        if include_lowercase:
            password.append(secrets.choice("abcdefghijklmnopqrstuvwxyz"))
        if include_uppercase:
            password.append(secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))
        if include_digits:
            password.append(secrets.choice("0123456789"))
        if include_symbols:
            password.append(secrets.choice("!@#$%^&*()_+-=[]{}|;:,.<>?"))
        
        # Fill the rest with random characters
        for _ in range(length - len(password)):
            password.append(secrets.choice(characters))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    def generate_recovery_email(self, base_email: str, sequence_id: int) -> str:
        """Generate a recovery email address."""
        # Extract domain from base email
        if '@' in base_email:
            local_part, domain = base_email.split('@', 1)
            recovery_email = f"{local_part}.recovery{sequence_id}@{domain}"
        else:
            recovery_email = f"{base_email}.recovery{sequence_id}@gmail.com"
        
        self.logger.debug("Recovery email generated", sequence_id=sequence_id)
        return recovery_email


class SecureStorage:
    """Secure storage for sensitive configuration data."""
    
    def __init__(self, password_manager: PasswordManager):
        self.password_manager = password_manager
    
    def store_proxy_credentials(self, username: str, password: str) -> str:
        """Store proxy credentials securely."""
        credentials = f"{username}:{password}"
        return self.password_manager.encrypt_password(credentials)
    
    def retrieve_proxy_credentials(self, encrypted_credentials: str) -> Tuple[str, str]:
        """Retrieve proxy credentials."""
        credentials = self.password_manager.decrypt_password(encrypted_credentials)
        if ':' in credentials:
            username, password = credentials.split(':', 1)
            return username, password
        return credentials, ""
    
    def store_api_key(self, api_key: str) -> str:
        """Store API key securely."""
        return self.password_manager.encrypt_password(api_key)
    
    def retrieve_api_key(self, encrypted_api_key: str) -> str:
        """Retrieve API key."""
        return self.password_manager.decrypt_password(encrypted_api_key)
