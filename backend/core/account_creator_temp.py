

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

    def __init__(self):
        self.ua = UserAgent()

    def random_delay(self, min_delay: float = 1.0, max_delay: float = 3.0) -> None:

        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)

    def human_like_typing(self, element, text: str, typing_speed: float = 0.1) -> None:

        for char in text:
            element.send_keys(char)

            delay = random.uniform(0.05, typing_speed)
            time.sleep(delay)

    def get_random_user_agent(self) -> str:

        return self.ua.random

    def simulate_mouse_movement(self, driver) -> None:

        try:

            elements = driver.find_elements(By.TAG_NAME, "input")
            if elements:
                random_element = random.choice(elements)
                driver.execute_script(
                    "arguments[0].scrollIntoView(true);",
                    random_element
                )
                self.random_delay(0.5, 1.5)
        except Exception:
            pass  

class WebDriverManager(LoggerMixin, AntiDetectionMixin):

    def __init__(self, config: WebDriverConfig, proxy_url: Optional[str] = None):
        super().__init__()
        self.config = config
        self.proxy_url = proxy_url
        self.driver: Optional[webdriver.Chrome] = None

    def create_driver(self) -> webdriver.Chrome:

        options = Options()

        if self.config.headless:
            options.add_argument("--headless")

        options.add_argument(f"--window-size={self.config.window_width},{self.config.window_height}")

        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        if self.config.disable_images:
            prefs = {"profile.managed_default_content_settings.images": 2}
            options.add_experimental_option("prefs", prefs)

        if self.config.user_agent_rotation:
            user_agent = self.get_random_user_agent()
            options.add_argument(f"--user-agent={user_agent}")

        if self.proxy_url:
            options.add_argument(f"--proxy-server={self.proxy_url}")

        try:

            driver = uc.Chrome(options=options)

            driver.set_page_load_timeout(self.config.page_load_timeout)
            driver.implicitly_wait(self.config.implicit_wait)

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

        if self.driver:
            try:
                self.driver.quit()
                self.logger.info("WebDriver quit successfully")
            except Exception as e:
                self.logger.error("Error quitting WebDriver", error=str(e))
            finally:
                self.driver = None

class GmailAccountCreator(LoggerMixin, AntiDetectionMixin):

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

        self.logger.info("Starting account creation", email=account.email)

        self.account_repo.update_status(account.id, AccountStatus.IN_PROGRESS)

        driver_manager = None
        try:

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

            driver_manager = WebDriverManager(self.webdriver_config, proxy_url)
            driver = driver_manager.create_driver()

            driver.get("https://accounts.google.com/signup/v2/webcreateaccount?flowName=GlifWebSignIn&flowEntry=SignUp")

            await asyncio.sleep(random.uniform(2, 5))

            first_name_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "firstName"))
            )
            self.human_like_typing(first_name_field, account.first_name)

            self.random_delay(
                self.account_config.delay_min,
                self.account_config.delay_max
            )

            last_name_field = driver.find_element(By.ID, "lastName")
            self.human_like_typing(last_name_field, account.last_name)

            next_button = driver.find_element(By.ID, "collectNameNext")
            next_button.click()

            await asyncio.sleep(random.uniform(2, 4))

            username_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "username"))
            )

            username = account.email.split('@')[0]
            self.human_like_typing(username_field, username)

            next_button = driver.find_element(By.ID, "usernameNext")
            next_button.click()

            await asyncio.sleep(random.uniform(2, 4))

            password_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.NAME, "Passwd"))
            )

            password = self.password_manager.decrypt_password(account.password_encrypted)
            self.human_like_typing(password_field, password)

            confirm_password_field = driver.find_element(By.NAME, "ConfirmPasswd")
            self.human_like_typing(confirm_password_field, password)

            next_button = driver.find_element(By.ID, "createpasswordNext")
            next_button.click()

            await asyncio.sleep(random.uniform(3, 6))

            try:
                phone_field = driver.find_element(By.ID, "phoneNumberId")

                self.logger.info("Phone verification required", email=account.email)

                self.account_repo.update_status(account.id, AccountStatus.PENDING)
                return False

            except:

                pass

            try:

                WebDriverWait(driver, 10).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'Welcome')]")),
                        EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Welcome')]")),
                        EC.url_contains("myaccount.google.com")
                    )
                )

                self.account_repo.update_status(account.id, AccountStatus.CREATED)
                self.logger.info("Account created successfully", email=account.email)

                cookies = driver.get_cookies()
                import json
                account.session_cookies = json.dumps(cookies)

                return True

            except TimeoutException:

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

        self.logger.info("Starting batch account creation", count=len(accounts))

        results = {"success": 0, "failed": 0, "pending": 0}

        for account in accounts:
            try:
                success = await self.create_account(account)
                if success:
                    results["success"] += 1
                else:

                    updated_account = self.account_repo.get_by_id(account.id)
                    if updated_account and updated_account.status == AccountStatus.PENDING:
                        results["pending"] += 1
                    else:
                        results["failed"] += 1

                await asyncio.sleep(random.uniform(
                    self.account_config.delay_min * 2,
                    self.account_config.delay_max * 2
                ))

            except Exception as e:
                self.logger.error("Batch creation error", account_id=account.id, error=str(e))
                results["failed"] += 1

        self.logger.info("Batch creation completed", results=results)
        return results