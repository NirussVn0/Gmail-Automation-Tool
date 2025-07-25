"""Unit tests for password manager."""

import pytest
from cryptography.fernet import InvalidToken

from backend.core.password_manager import PasswordManager, SecureStorage


class TestPasswordManager:
    """Test cases for PasswordManager class."""
    
    def test_generate_password(self, test_password_manager):
        """Test password generation."""
        password = test_password_manager.generate_password("base", 1)
        
        assert isinstance(password, str)
        assert len(password) > 6  # Should be longer than just "base1"
        assert "base1" in password
    
    def test_encrypt_decrypt_password(self, test_password_manager):
        """Test password encryption and decryption."""
        original_password = "TestPassword123"
        
        # Encrypt password
        encrypted = test_password_manager.encrypt_password(original_password)
        assert isinstance(encrypted, str)
        assert encrypted != original_password
        
        # Decrypt password
        decrypted = test_password_manager.decrypt_password(encrypted)
        assert decrypted == original_password
    
    def test_decrypt_invalid_password(self, test_password_manager):
        """Test decryption of invalid password."""
        with pytest.raises(Exception):  # Should raise InvalidToken or similar
            test_password_manager.decrypt_password("invalid_encrypted_data")
    
    def test_hash_password(self, test_password_manager):
        """Test password hashing."""
        password = "TestPassword123"
        
        hash1 = test_password_manager.hash_password(password)
        hash2 = test_password_manager.hash_password(password)
        
        assert isinstance(hash1, str)
        assert isinstance(hash2, str)
        assert hash1 == hash2  # Same password should produce same hash
        assert hash1 != password  # Hash should be different from original
    
    def test_verify_password(self, test_password_manager):
        """Test password verification."""
        password = "TestPassword123"
        wrong_password = "WrongPassword123"
        
        password_hash = test_password_manager.hash_password(password)
        
        # Correct password should verify
        assert test_password_manager.verify_password(password, password_hash) is True
        
        # Wrong password should not verify
        assert test_password_manager.verify_password(wrong_password, password_hash) is False
    
    def test_generate_secure_password(self, test_password_manager):
        """Test secure password generation."""
        # Test default parameters
        password = test_password_manager.generate_secure_password()
        assert len(password) == 16
        assert any(c.isupper() for c in password)
        assert any(c.islower() for c in password)
        assert any(c.isdigit() for c in password)
        assert any(not c.isalnum() for c in password)
        
        # Test custom length
        password = test_password_manager.generate_secure_password(length=20)
        assert len(password) == 20
        
        # Test without symbols
        password = test_password_manager.generate_secure_password(include_symbols=False)
        assert all(c.isalnum() for c in password)
    
    def test_generate_secure_password_invalid_params(self, test_password_manager):
        """Test secure password generation with invalid parameters."""
        with pytest.raises(ValueError):
            test_password_manager.generate_secure_password(
                include_uppercase=False,
                include_lowercase=False,
                include_digits=False,
                include_symbols=False
            )
    
    def test_generate_recovery_email(self, test_password_manager):
        """Test recovery email generation."""
        base_email = "test@gmail.com"
        recovery_email = test_password_manager.generate_recovery_email(base_email, 1)
        
        assert "recovery1" in recovery_email
        assert "@gmail.com" in recovery_email
        
        # Test without @ in base email
        base_email = "test"
        recovery_email = test_password_manager.generate_recovery_email(base_email, 2)
        assert "test.recovery2@gmail.com" == recovery_email
    
    def test_validate_password_strength(self, test_password_manager):
        """Test password strength validation."""
        # Strong password
        strong_password = "StrongP@ssw0rd123"
        analysis = test_password_manager.validate_password_strength(strong_password)
        
        assert analysis["strength"] == "strong"
        assert analysis["has_uppercase"] is True
        assert analysis["has_lowercase"] is True
        assert analysis["has_digits"] is True
        assert analysis["has_symbols"] is True
        assert analysis["score"] >= 5
        
        # Weak password
        weak_password = "weak"
        analysis = test_password_manager.validate_password_strength(weak_password)
        
        assert analysis["strength"] == "weak"
        assert analysis["score"] < 3


class TestSecureStorage:
    """Test cases for SecureStorage class."""
    
    def test_store_retrieve_proxy_credentials(self, test_password_manager):
        """Test storing and retrieving proxy credentials."""
        storage = SecureStorage(test_password_manager)
        
        username = "testuser"
        password = "testpass"
        
        # Store credentials
        encrypted = storage.store_proxy_credentials(username, password)
        assert isinstance(encrypted, str)
        assert encrypted != f"{username}:{password}"
        
        # Retrieve credentials
        retrieved_username, retrieved_password = storage.retrieve_proxy_credentials(encrypted)
        assert retrieved_username == username
        assert retrieved_password == password
    
    def test_store_retrieve_api_key(self, test_password_manager):
        """Test storing and retrieving API key."""
        storage = SecureStorage(test_password_manager)
        
        api_key = "test_api_key_123"
        
        # Store API key
        encrypted = storage.store_api_key(api_key)
        assert isinstance(encrypted, str)
        assert encrypted != api_key
        
        # Retrieve API key
        retrieved_key = storage.retrieve_api_key(encrypted)
        assert retrieved_key == api_key
    
    def test_retrieve_proxy_credentials_no_colon(self, test_password_manager):
        """Test retrieving proxy credentials without colon separator."""
        storage = SecureStorage(test_password_manager)
        
        # Store credentials without colon
        credentials = "just_username"
        encrypted = test_password_manager.encrypt_password(credentials)
        
        username, password = storage.retrieve_proxy_credentials(encrypted)
        assert username == "just_username"
        assert password == ""
