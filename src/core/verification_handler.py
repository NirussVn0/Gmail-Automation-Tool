"""Phone verification handler with SMS service integration."""

import asyncio
import re
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import aiohttp
import requests
from sqlalchemy.orm import Session

from ..database.models import VerificationSession, VerificationStatus
from ..database.repositories import VerificationSessionRepository
from ..utils.config import get_config
from ..utils.logging import LoggerMixin


class SMSServiceProvider(ABC, LoggerMixin):
    """Abstract base class for SMS verification service providers."""
    
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
    
    @abstractmethod
    async def get_phone_number(self, country: str = "US", service: str = "google") -> Tuple[bool, Optional[str], Optional[str]]:
        """Get a phone number for verification.
        
        Returns:
            Tuple of (success, phone_number, session_id)
        """
        pass
    
    @abstractmethod
    async def get_verification_code(self, session_id: str, timeout: int = 300) -> Tuple[bool, Optional[str]]:
        """Get verification code from SMS.
        
        Returns:
            Tuple of (success, verification_code)
        """
        pass
    
    @abstractmethod
    async def release_phone_number(self, session_id: str) -> bool:
        """Release the phone number back to the pool."""
        pass
    
    @abstractmethod
    async def get_balance(self) -> Tuple[bool, Optional[float]]:
        """Get account balance.
        
        Returns:
            Tuple of (success, balance)
        """
        pass


class TextVerifiedProvider(SMSServiceProvider):
    """TextVerified SMS service provider."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key, "https://www.textverified.com/api")
        self.service_map = {
            "google": "Google",
            "gmail": "Google",
            "facebook": "Facebook",
            "twitter": "Twitter",
            "instagram": "Instagram"
        }
    
    async def get_phone_number(self, country: str = "US", service: str = "google") -> Tuple[bool, Optional[str], Optional[str]]:
        """Get a phone number from TextVerified."""
        try:
            service_name = self.service_map.get(service.lower(), "Google")
            
            url = f"{self.base_url}/Users/{self.api_key}/Verifications"
            data = {
                "target": service_name,
                "countryCode": country
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        if result.get("success"):
                            verification_id = result.get("id")
                            phone_number = result.get("number")
                            
                            self.logger.info(
                                "Phone number obtained",
                                service=service_name,
                                country=country,
                                verification_id=verification_id
                            )
                            
                            return True, phone_number, str(verification_id)
                        else:
                            error_msg = result.get("message", "Unknown error")
                            self.logger.error(f"Failed to get phone number: {error_msg}")
                            return False, None, None
                    else:
                        self.logger.error(f"HTTP error: {response.status}")
                        return False, None, None
        
        except Exception as e:
            self.logger.error(f"Error getting phone number: {e}")
            return False, None, None
    
    async def get_verification_code(self, session_id: str, timeout: int = 300) -> Tuple[bool, Optional[str]]:
        """Get verification code from TextVerified."""
        try:
            url = f"{self.base_url}/Users/{self.api_key}/Verifications/{session_id}"
            
            start_time = datetime.utcnow()
            
            async with aiohttp.ClientSession() as session:
                while (datetime.utcnow() - start_time).seconds < timeout:
                    async with session.get(url) as response:
                        if response.status == 200:
                            result = await response.json()
                            
                            if result.get("success"):
                                sms_data = result.get("sms")
                                if sms_data:
                                    sms_text = sms_data.get("text", "")
                                    
                                    # Extract verification code from SMS text
                                    code = self._extract_verification_code(sms_text)
                                    if code:
                                        self.logger.info(
                                            "Verification code received",
                                            session_id=session_id,
                                            code_length=len(code)
                                        )
                                        return True, code
                            
                            # Wait before next check
                            await asyncio.sleep(5)
                        else:
                            self.logger.error(f"HTTP error checking SMS: {response.status}")
                            await asyncio.sleep(10)
                
                self.logger.warning(f"Timeout waiting for verification code: {session_id}")
                return False, None
        
        except Exception as e:
            self.logger.error(f"Error getting verification code: {e}")
            return False, None
    
    async def release_phone_number(self, session_id: str) -> bool:
        """Release phone number (TextVerified doesn't require explicit release)."""
        return True
    
    async def get_balance(self) -> Tuple[bool, Optional[float]]:
        """Get account balance from TextVerified."""
        try:
            url = f"{self.base_url}/Users/{self.api_key}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        if result.get("success"):
                            balance = result.get("credit_balance", 0.0)
                            return True, float(balance)
                        else:
                            return False, None
                    else:
                        return False, None
        
        except Exception as e:
            self.logger.error(f"Error getting balance: {e}")
            return False, None
    
    def _extract_verification_code(self, sms_text: str) -> Optional[str]:
        """Extract verification code from SMS text."""
        # Common patterns for verification codes
        patterns = [
            r'\b(\d{6})\b',  # 6-digit code
            r'\b(\d{5})\b',  # 5-digit code
            r'\b(\d{4})\b',  # 4-digit code
            r'code[:\s]+(\d+)',  # "code: 123456"
            r'verification[:\s]+(\d+)',  # "verification: 123456"
            r'confirm[:\s]+(\d+)',  # "confirm: 123456"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, sms_text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None


class SMSActivateProvider(SMSServiceProvider):
    """SMS-Activate service provider."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key, "https://sms-activate.org/stubs/handler_api.php")
        self.service_map = {
            "google": "go",
            "gmail": "go",
            "facebook": "fb",
            "twitter": "tw",
            "instagram": "ig"
        }
    
    async def get_phone_number(self, country: str = "0", service: str = "google") -> Tuple[bool, Optional[str], Optional[str]]:
        """Get a phone number from SMS-Activate."""
        try:
            service_code = self.service_map.get(service.lower(), "go")
            
            params = {
                "api_key": self.api_key,
                "action": "getNumber",
                "service": service_code,
                "country": country
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        result = await response.text()
                        
                        if result.startswith("ACCESS_NUMBER"):
                            parts = result.split(":")
                            if len(parts) >= 3:
                                activation_id = parts[1]
                                phone_number = parts[2]
                                
                                self.logger.info(
                                    "Phone number obtained",
                                    service=service_code,
                                    country=country,
                                    activation_id=activation_id
                                )
                                
                                return True, phone_number, activation_id
                        else:
                            self.logger.error(f"SMS-Activate error: {result}")
                            return False, None, None
                    else:
                        return False, None, None
        
        except Exception as e:
            self.logger.error(f"Error getting phone number: {e}")
            return False, None, None
    
    async def get_verification_code(self, session_id: str, timeout: int = 300) -> Tuple[bool, Optional[str]]:
        """Get verification code from SMS-Activate."""
        try:
            params = {
                "api_key": self.api_key,
                "action": "getStatus",
                "id": session_id
            }
            
            start_time = datetime.utcnow()
            
            async with aiohttp.ClientSession() as session:
                while (datetime.utcnow() - start_time).seconds < timeout:
                    async with session.get(self.base_url, params=params) as response:
                        if response.status == 200:
                            result = await response.text()
                            
                            if result.startswith("STATUS_OK"):
                                parts = result.split(":")
                                if len(parts) >= 2:
                                    code = parts[1]
                                    self.logger.info(
                                        "Verification code received",
                                        session_id=session_id,
                                        code_length=len(code)
                                    )
                                    return True, code
                            elif result == "STATUS_WAIT_CODE":
                                # Still waiting for SMS
                                await asyncio.sleep(5)
                            else:
                                self.logger.error(f"SMS-Activate status error: {result}")
                                return False, None
                        else:
                            await asyncio.sleep(10)
                
                return False, None
        
        except Exception as e:
            self.logger.error(f"Error getting verification code: {e}")
            return False, None
    
    async def release_phone_number(self, session_id: str) -> bool:
        """Release phone number back to SMS-Activate."""
        try:
            params = {
                "api_key": self.api_key,
                "action": "setStatus",
                "status": "8",  # Cancel activation
                "id": session_id
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        result = await response.text()
                        return result == "ACCESS_CANCEL"
                    return False
        
        except Exception as e:
            self.logger.error(f"Error releasing phone number: {e}")
            return False
    
    async def get_balance(self) -> Tuple[bool, Optional[float]]:
        """Get account balance from SMS-Activate."""
        try:
            params = {
                "api_key": self.api_key,
                "action": "getBalance"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        result = await response.text()
                        
                        if result.startswith("ACCESS_BALANCE"):
                            balance_str = result.split(":")[1]
                            return True, float(balance_str)
                        else:
                            return False, None
                    return False, None
        
        except Exception as e:
            self.logger.error(f"Error getting balance: {e}")
            return False, None


class VerificationHandler(LoggerMixin):
    """Main verification handler that manages SMS verification process."""
    
    def __init__(self, verification_repo: VerificationSessionRepository, session: Session):
        self.verification_repo = verification_repo
        self.session = session
        self.providers: Dict[str, SMSServiceProvider] = {}
        
        # Initialize providers based on configuration
        config = get_config()
        self._initialize_providers(config)
    
    def _initialize_providers(self, config) -> None:
        """Initialize SMS service providers."""
        # Add TextVerified if configured
        if hasattr(config, 'sms_service_api_key') and config.sms_service_api_key:
            if config.sms_service_primary == "textverified":
                self.providers["textverified"] = TextVerifiedProvider(config.sms_service_api_key)
        
        # Add SMS-Activate if configured
        if hasattr(config, 'sms_service_backup_api_key') and config.sms_service_backup_api_key:
            if config.sms_service_backup == "sms-activate":
                self.providers["sms-activate"] = SMSActivateProvider(config.sms_service_backup_api_key)
    
    async def start_verification(
        self,
        account_id: int,
        service: str = "google",
        country: str = "US",
        preferred_provider: Optional[str] = None
    ) -> Tuple[bool, Optional[VerificationSession]]:
        """Start phone verification process."""
        try:
            # Select provider
            provider = self._select_provider(preferred_provider)
            if not provider:
                self.logger.error("No SMS providers available")
                return False, None
            
            # Get phone number
            success, phone_number, service_session_id = await provider.get_phone_number(country, service)
            
            if not success or not phone_number:
                self.logger.error("Failed to get phone number")
                return False, None
            
            # Create verification session
            verification_session = self.verification_repo.create(
                account_id=account_id,
                phone_number=phone_number,
                service_name=provider.__class__.__name__,
                service_session_id=service_session_id,
                status=VerificationStatus.PENDING,
                expires_at=datetime.utcnow() + timedelta(minutes=10)
            )
            
            self.session.commit()
            
            self.logger.info(
                "Verification session started",
                session_id=verification_session.id,
                phone_number=phone_number,
                provider=provider.__class__.__name__
            )
            
            return True, verification_session
        
        except Exception as e:
            self.logger.error(f"Error starting verification: {e}")
            return False, None
    
    async def get_verification_code(self, session_id: int, timeout: int = 300) -> Tuple[bool, Optional[str]]:
        """Get verification code for a session."""
        try:
            verification_session = self.verification_repo.get_by_id(session_id)
            if not verification_session:
                return False, None
            
            # Get provider
            provider = self._get_provider_by_name(verification_session.service_name)
            if not provider:
                return False, None
            
            # Get verification code
            success, code = await provider.get_verification_code(
                verification_session.service_session_id,
                timeout
            )
            
            if success and code:
                # Update session
                self.verification_repo.update_verification_code(session_id, code)
                self.session.commit()
                
                self.logger.info(
                    "Verification code obtained",
                    session_id=session_id,
                    code_length=len(code)
                )
                
                return True, code
            else:
                # Mark as failed
                verification_session.status = VerificationStatus.FAILED
                self.session.commit()
                return False, None
        
        except Exception as e:
            self.logger.error(f"Error getting verification code: {e}")
            return False, None
    
    async def complete_verification(self, session_id: int) -> bool:
        """Mark verification as completed."""
        try:
            verification_session = self.verification_repo.get_by_id(session_id)
            if not verification_session:
                return False
            
            verification_session.status = VerificationStatus.VERIFIED
            verification_session.verified_at = datetime.utcnow()
            self.session.commit()
            
            self.logger.info(f"Verification completed for session {session_id}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error completing verification: {e}")
            return False
    
    def _select_provider(self, preferred_provider: Optional[str] = None) -> Optional[SMSServiceProvider]:
        """Select an SMS provider."""
        if preferred_provider and preferred_provider in self.providers:
            return self.providers[preferred_provider]
        
        # Return first available provider
        if self.providers:
            return next(iter(self.providers.values()))
        
        return None
    
    def _get_provider_by_name(self, provider_name: str) -> Optional[SMSServiceProvider]:
        """Get provider by class name."""
        for provider in self.providers.values():
            if provider.__class__.__name__ == provider_name:
                return provider
        return None
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired verification sessions."""
        try:
            expired_sessions = self.verification_repo.get_expired_sessions()
            
            for session in expired_sessions:
                # Release phone number if possible
                provider = self._get_provider_by_name(session.service_name)
                if provider and session.service_session_id:
                    await provider.release_phone_number(session.service_session_id)
                
                # Update status
                session.status = VerificationStatus.EXPIRED
            
            self.session.commit()
            
            self.logger.info(f"Cleaned up {len(expired_sessions)} expired verification sessions")
            return len(expired_sessions)
        
        except Exception as e:
            self.logger.error(f"Error cleaning up expired sessions: {e}")
            return 0
