"""Gmail account creation engine with anti-detection measures."""

import asyncio
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, WebDriverException
import undetected_chromedriver as uc
from fake_useragent import UserAgent

from ..database.models import AccountStatus, GmailAccount
from ..database.repositories import GmailAccountRepository, ProxyRepository
from ..utils.config import AccountCreationConfig, WebDriverConfig
from ..utils.logging import LoggerMixin
from .password_manager import PasswordManager


class AntiDetectionMixin:
    """Mixin for anti-detection measures."""
    
    def __init__(self):
        self.ua = UserAgent()
    
    def random_delay(self, min_delay: float = 1.0, max_delay: float = 3.0) -> None:
        """Add random delay between actions."""
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def human_like_typing(self, element, text: str, typing_speed: float = 0.1) -> None:
        """Type text with human-like delays."""
        for char in text:
            element.send_keys(char)
            # Random delay between keystrokes
            delay = random.uniform(0.05, typing_speed)
            time.sleep(delay)
    
    def get_random_user_agent(self) -> str:
        """Get a random user agent string."""
        return self.ua.random
    
    def simulate_mouse_movement(self, driver) -> None:
        """Simulate random mouse movements."""
        try:
            # Move to random elements on the page
            elements = driver.find_elements(By.TAG_NAME, "input")
            if elements:
                random_element = random.choice(elements)
                driver.execute_script(
                    "arguments[0].scrollIntoView(true);", 
                    random_element
                )
                self.random_delay(0.5, 1.5)
        except Exception:
            pass  # Ignore errors in mouse simulation


class WebDriverManager(LoggerMixin, AntiDetectionMixin):
    """Manages WebDriver instances with anti-detection features."""
    
    def __init__(self, config: WebDriverConfig, proxy_url: Optional[str] = None):
        super().__init__()
        self.config = config
        self.proxy_url = proxy_url
        self.driver: Optional[webdriver.Chrome] = None
    
    def create_driver(self) -> webdriver.Chrome:
        """Create a new WebDriver instance with anti-detection measures."""
        options = Options()
        
        # Basic options
        if self.config.headless:
            options.add_argument("--headless")
        
        options.add_argument(f"--window-size={self.config.window_width},{self.config.window_height}")
        
        # Anti-detection options
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Performance options
        if self.config.disable_images:
            prefs = {"profile.managed_default_content_settings.images": 2}
            options.add_experimental_option("prefs", prefs)
        
        # User agent
        if self.config.user_agent_rotation:
            user_agent = self.get_random_user_agent()
            options.add_argument(f"--user-agent={user_agent}")
        
        # Proxy configuration
        if self.proxy_url:
            options.add_argument(f"--proxy-server={self.proxy_url}")
        
        try:
            # Use undetected-chromedriver for better anti-detection
            driver = uc.Chrome(options=options)
            
            # Set timeouts
            driver.set_page_load_timeout(self.config.page_load_timeout)
            driver.implicitly_wait(self.config.implicit_wait)
            
            # Execute script to remove webdriver property
            driver.execute_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )
            
            self.driver = driver
            self.logger.info("WebDriver created successfully", proxy=self.proxy_url)
            return driver
            
        except Exception as e:
            self.logger.error("Failed to create WebDriver", error=str(e))
            raise
    
    def quit_driver(self) -> None:
        """Quit the WebDriver instance."""
        if self.driver:
            try:
                self.driver.quit()
                self.logger.info("WebDriver quit successfully")
            except Exception as e:
                self.logger.error("Error quitting WebDriver", error=str(e))
            finally:
                self.driver = None


class GmailAccountCreator(LoggerMixin, AntiDetectionMixin):
    """Gmail account creation engine."""
    
    def __init__(
        self,
        account_config: AccountCreationConfig,
        webdriver_config: WebDriverConfig,
        password_manager: PasswordManager,
        account_repo: GmailAccountRepository,
        proxy_repo: ProxyRepository
    ):
        super().__init__()
        self.account_config = account_config
        self.webdriver_config = webdriver_config
        self.password_manager = password_manager
        self.account_repo = account_repo
        self.proxy_repo = proxy_repo
    
    async def create_account(self, account: GmailAccount) -> bool:
        """Create a single Gmail account."""
        self.logger.info("Starting account creation", email=account.email)
        
        # Update account status
        self.account_repo.update_status(account.id, AccountStatus.IN_PROGRESS)
        
        driver_manager = None
        try:
            # Get proxy if enabled
            proxy_url = None
            if account.proxy_id:
                proxy = self.proxy_repo.get_by_id(account.proxy_id)
                if proxy:
                    proxy_url = f"{proxy.proxy_type}://{proxy.host}:{proxy.port}"
                    if proxy.username and proxy.password_encrypted:
                        username, password = self.password_manager.decrypt_password(
                            proxy.password_encrypted
                        ).split(':', 1)
                        proxy_url = f"{proxy.proxy_type}://{username}:{password}@{proxy.host}:{proxy.port}"
            
            # Create WebDriver
            driver_manager = WebDriverManager(self.webdriver_config, proxy_url)
            driver = driver_manager.create_driver()
            
            # Navigate to Gmail signup
            driver.get("https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp")
            
            # Wait for page to load
            await asyncio.sleep(random.uniform(2, 5))
            
            # Fill first name
            first_name_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "firstName"))
            )
            self.human_like_typing(first_name_field, account.first_name)
            
            # Random delay
            self.random_delay(
                self.account_config.delay_min,
                self.account_config.delay_max
            )
            
            # Fill last name
            last_name_field = driver.find_element(By.ID, "lastName")
            self.human_like_typing(last_name_field, account.last_name)
            
            # Continue to next step
            next_button = driver.find_element(By.ID, "collectNameNext")
            next_button.click()
            
            # Wait for username page
            await asyncio.sleep(random.uniform(2, 4))
            
            # Fill username
            username_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            
            # Extract username from email
            username = account.email.split('@')[0]
            self.human_like_typing(username_field, username)
            
            # Continue
            next_button = driver.find_element(By.ID, "usernameNext")
            next_button.click()
            
            # Wait for password page
            await asyncio.sleep(random.uniform(2, 4))
            
            # Fill password
            password_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.NAME, "Passwd"))
            )
            
            # Decrypt password
            password = self.password_manager.decrypt_password(account.password_encrypted)
            self.human_like_typing(password_field, password)
            
            # Confirm password
            confirm_password_field = driver.find_element(By.NAME, "ConfirmPasswd")
            self.human_like_typing(confirm_password_field, password)
            
            # Continue
            next_button = driver.find_element(By.ID, "createpasswordNext")
            next_button.click()
            
            # Wait for phone verification page
            await asyncio.sleep(random.uniform(3, 6))
            
            # Check if phone verification is required
            try:
                phone_field = driver.find_element(By.ID, "phoneNumberId")
                # Phone verification required - this will be handled in Phase 4
                self.logger.info("Phone verification required", email=account.email)
                
                # For now, mark as pending verification
                self.account_repo.update_status(account.id, AccountStatus.PENDING)
                return False
                
            except:
                # No phone verification required, continue
                pass
            
            # Check for successful creation
            try:
                # Look for success indicators
                WebDriverWait(driver, 10).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'Welcome')]")),
                        EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Welcome')]")),
                        EC.url_contains("myaccount.google.com")
                    )
                )
                
                # Account created successfully
                self.account_repo.update_status(account.id, AccountStatus.CREATED)
                self.logger.info("Account created successfully", email=account.email)
                
                # Save session cookies for future use
                cookies = driver.get_cookies()
                import json
                account.session_cookies = json.dumps(cookies)
                
                return True
                
            except TimeoutException:
                # Check for errors
                error_elements = driver.find_elements(By.CLASS_NAME, "error")
                if error_elements:
                    error_message = error_elements[0].text
                    self.logger.error("Account creation failed", email=account.email, error=error_message)
                else:
                    self.logger.error("Account creation failed - unknown error", email=account.email)
                
                self.account_repo.update_status(account.id, AccountStatus.FAILED)
                return False
        
        except Exception as e:
            self.logger.error("Account creation error", email=account.email, error=str(e))
            self.account_repo.update_status(account.id, AccountStatus.FAILED)
            return False
        
        finally:
            if driver_manager:
                driver_manager.quit_driver()
    
    async def create_accounts_batch(self, accounts: List[GmailAccount]) -> Dict[str, int]:
        """Create multiple accounts in a batch."""
        self.logger.info("Starting batch account creation", count=len(accounts))
        
        results = {"success": 0, "failed": 0, "pending": 0}
        
        for account in accounts:
            try:
                success = await self.create_account(account)
                if success:
                    results["success"] += 1
                else:
                    # Check final status
                    updated_account = self.account_repo.get_by_id(account.id)
                    if updated_account and updated_account.status == AccountStatus.PENDING:
                        results["pending"] += 1
                    else:
                        results["failed"] += 1
                
                # Delay between accounts
                await asyncio.sleep(random.uniform(
                    self.account_config.delay_min * 2,
                    self.account_config.delay_max * 2
                ))
                
            except Exception as e:
                self.logger.error("Batch creation error", account_id=account.id, error=str(e))
                results["failed"] += 1
        
        self.logger.info("Batch creation completed", results=results)
        return results
