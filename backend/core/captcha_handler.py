import asyncio
import base64
import io
import time
from abc import ABC, abstractmethod
from typing import Dict, Optional, Tuple

import requests
from PIL import Image
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException

from ..utils.logging import LoggerMixin


class CaptchaSolver(ABC, LoggerMixin):
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    @abstractmethod
    async def solve_image_captcha(self, image_data: bytes) -> Tuple[bool, Optional[str]]:
        pass
    
    @abstractmethod
    async def solve_recaptcha_v2(self, site_key: str, page_url: str) -> Tuple[bool, Optional[str]]:
        pass
    
    @abstractmethod
    async def get_balance(self) -> Tuple[bool, Optional[float]]:
        pass


class TwoCaptchaSolver(CaptchaSolver):
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "http://2captcha.com"
    
    async def solve_image_captcha(self, image_data: bytes) -> Tuple[bool, Optional[str]]:
        try:
            submit_url = f"{self.base_url}/in.php"
            files = {"file": ("captcha.png", image_data, "image/png")}
            data = {
                "key": self.api_key,
                "method": "post"
            }
            
            response = requests.post(submit_url, files=files, data=data)
            
            if response.status_code != 200:
                self.logger.error(f"Failed to submit CAPTCHA: {response.status_code}")
                return False, None
            
            result = response.text
            if not result.startswith("OK|"):
                self.logger.error(f"CAPTCHA submission failed: {result}")
                return False, None
            
            captcha_id = result.split("|")[1]

            return await self._wait_for_solution(captcha_id)
            
        except Exception as e:
            self.logger.error(f"Error solving image CAPTCHA: {e}")
            return False, None
    
    async def solve_recaptcha_v2(self, site_key: str, page_url: str) -> Tuple[bool, Optional[str]]:
        try:
            submit_url = f"{self.base_url}/in.php"
            data = {
                "key": self.api_key,
                "method": "userrecaptcha",
                "googlekey": site_key,
                "pageurl": page_url
            }
            
            response = requests.post(submit_url, data=data)
            
            if response.status_code != 200:
                self.logger.error(f"Failed to submit reCAPTCHA: {response.status_code}")
                return False, None
            
            result = response.text
            if not result.startswith("OK|"):
                self.logger.error(f"reCAPTCHA submission failed: {result}")
                return False, None
            
            captcha_id = result.split("|")[1]

            return await self._wait_for_solution(captcha_id, timeout=300)
            
        except Exception as e:
            self.logger.error(f"Error solving reCAPTCHA v2: {e}")
            return False, None
    
    async def _wait_for_solution(self, captcha_id: str, timeout: int = 120) -> Tuple[bool, Optional[str]]:
        result_url = f"{self.base_url}/res.php"
        params = {
            "key": self.api_key,
            "action": "get",
            "id": captcha_id
        }
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            await asyncio.sleep(5)
            
            try:
                response = requests.get(result_url, params=params)
                
                if response.status_code != 200:
                    continue
                
                result = response.text
                
                if result == "CAPCHA_NOT_READY":
                    continue
                elif result.startswith("OK|"):
                    solution = result.split("|")[1]
                    self.logger.info(f"CAPTCHA solved successfully: {captcha_id}")
                    return True, solution
                else:
                    self.logger.error(f"CAPTCHA solving failed: {result}")
                    return False, None
                    
            except Exception as e:
                self.logger.error(f"Error checking CAPTCHA solution: {e}")
                continue
        
        self.logger.error(f"CAPTCHA solving timeout: {captcha_id}")
        return False, None
    
    async def get_balance(self) -> Tuple[bool, Optional[float]]:
        try:
            url = f"{self.base_url}/res.php"
            params = {
                "key": self.api_key,
                "action": "getbalance"
            }
            
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                try:
                    balance = float(response.text)
                    return True, balance
                except ValueError:
                    return False, None
            
            return False, None
            
        except Exception as e:
            self.logger.error(f"Error getting balance: {e}")
            return False, None


class CaptchaDetector(LoggerMixin):
    def __init__(self):
        self.captcha_selectors = {
            "recaptcha_v2": [
                "iframe[src*='recaptcha']",
                ".g-recaptcha",
                "#recaptcha",
                "[data-sitekey]"
            ],
            "recaptcha_v3": [
                "script[src*='recaptcha/releases/']",
                "[data-action]"
            ],
            "hcaptcha": [
                "iframe[src*='hcaptcha']",
                ".h-captcha",
                "[data-hcaptcha-sitekey]"
            ],
            "image_captcha": [
                "img[src*='captcha']",
                ".captcha-image",
                "#captcha_image",
                "img[alt*='captcha']"
            ],
            "text_captcha": [
                "input[name*='captcha']",
                ".captcha-input",
                "#captcha_code"
            ]
        }
    
    def detect_captcha_type(self, driver: webdriver.Chrome) -> Optional[str]:
        try:
            for captcha_type, selectors in self.captcha_selectors.items():
                for selector in selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            self.logger.info(f"Detected {captcha_type} CAPTCHA")
                            return captcha_type
                    except Exception:
                        continue
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error detecting CAPTCHA: {e}")
            return None
    
    def get_captcha_image(self, driver: webdriver.Chrome) -> Optional[bytes]:
        try:
            image_selectors = [
                "img[src*='captcha']",
                ".captcha-image img",
                "#captcha_image",
                "img[alt*='captcha']",
                "img[alt*='verification']"
            ]
            
            for selector in image_selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        img_element = elements[0]

                        img_base64 = driver.execute_script("""
                            var canvas = document.createElement('canvas');
                            var ctx = canvas.getContext('2d');
                            var img = arguments[0];
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            return canvas.toDataURL('image/png').substring(22);
                        """, img_element)
                        
                        if img_base64:
                            return base64.b64decode(img_base64)
                            
                except Exception as e:
                    self.logger.debug(f"Failed to extract image with selector {selector}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error extracting CAPTCHA image: {e}")
            return None
    
    def get_recaptcha_site_key(self, driver: webdriver.Chrome) -> Optional[str]:
        try:
            selectors = [
                "[data-sitekey]",
                ".g-recaptcha[data-sitekey]",
                "iframe[src*='recaptcha']"
            ]
            
            for selector in selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        element = elements[0]
                        
                        site_key = element.get_attribute("data-sitekey")
                        if site_key:
                            return site_key
                        
                        src = element.get_attribute("src")
                        if src and "k=" in src:
                            site_key = src.split("k=")[1].split("&")[0]
                            return site_key
                            
                except Exception:
                    continue
            
            page_source = driver.page_source
            if "data-sitekey=" in page_source:
                start = page_source.find("data-sitekey=") + 14
                end = page_source.find('"', start)
                if end > start:
                    return page_source[start:end]
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error extracting reCAPTCHA site key: {e}")
            return None


class CaptchaHandler(LoggerMixin):
    def __init__(self, solver: Optional[CaptchaSolver] = None):
        self.solver = solver
        self.detector = CaptchaDetector()
    
    async def handle_captcha(self, driver: webdriver.Chrome) -> bool:
        try:
            captcha_type = self.detector.detect_captcha_type(driver)
            
            if not captcha_type:
                return True
            
            if not self.solver:
                self.logger.warning("CAPTCHA detected but no solver configured")
                return False
            
            self.logger.info(f"Handling {captcha_type} CAPTCHA")
            
            if captcha_type == "image_captcha":
                return await self._handle_image_captcha(driver)
            elif captcha_type == "recaptcha_v2":
                return await self._handle_recaptcha_v2(driver)
            else:
                self.logger.warning(f"Unsupported CAPTCHA type: {captcha_type}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error handling CAPTCHA: {e}")
            return False
    
    async def _handle_image_captcha(self, driver: webdriver.Chrome) -> bool:
        try:
            image_data = self.detector.get_captcha_image(driver)
            if not image_data:
                self.logger.error("Failed to extract CAPTCHA image")
                return False
            
            success, solution = await self.solver.solve_image_captcha(image_data)
            if not success or not solution:
                self.logger.error("Failed to solve image CAPTCHA")
                return False
            
            input_selectors = [
                "input[name*='captcha']",
                ".captcha-input",
                "#captcha_code",
                "input[type='text'][placeholder*='captcha']"
            ]
            
            for selector in input_selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        input_element = elements[0]
                        input_element.clear()
                        input_element.send_keys(solution)
                        
                        self.logger.info("CAPTCHA solution entered successfully")
                        return True
                        
                except Exception:
                    continue
            
            self.logger.error("Failed to find CAPTCHA input field")
            return False
            
        except Exception as e:
            self.logger.error(f"Error handling image CAPTCHA: {e}")
            return False
    
    async def _handle_recaptcha_v2(self, driver: webdriver.Chrome) -> bool:
        try:
            site_key = self.detector.get_recaptcha_site_key(driver)
            if not site_key:
                self.logger.error("Failed to extract reCAPTCHA site key")
                return False

            page_url = driver.current_url

            success, token = await self.solver.solve_recaptcha_v2(site_key, page_url)
            if not success or not token:
                self.logger.error("Failed to solve reCAPTCHA v2")
                return False
            
            driver.execute_script(f"""
                document.getElementById('g-recaptcha-response').innerHTML = '{token}';
                if (typeof grecaptcha !== 'undefined') {{
                    grecaptcha.getResponse = function() {{ return '{token}'; }};
                }}
            """)
            
            self.logger.info("reCAPTCHA v2 token injected successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error handling reCAPTCHA v2: {e}")
            return False
