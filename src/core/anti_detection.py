"""Advanced anti-detection measures for browser automation."""

import asyncio
import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from fake_useragent import UserAgent

from ..utils.config import WebDriverConfig
from ..utils.logging import LoggerMixin


class BehaviorPattern:
    """Represents a human behavior pattern."""
    
    def __init__(self, name: str, actions: List[Dict], probability: float = 1.0):
        self.name = name
        self.actions = actions
        self.probability = probability


class AdvancedAntiDetection(LoggerMixin):
    """Advanced anti-detection system with sophisticated evasion techniques."""
    
    def __init__(self, config: WebDriverConfig):
        self.config = config
        self.user_agent = UserAgent()
        self.behavior_patterns = self._initialize_behavior_patterns()
        self.session_fingerprint = self._generate_session_fingerprint()
        
        # Timing patterns
        self.typing_patterns = {
            "fast": {"min": 0.05, "max": 0.15, "variance": 0.02},
            "normal": {"min": 0.1, "max": 0.3, "variance": 0.05},
            "slow": {"min": 0.2, "max": 0.5, "variance": 0.1}
        }
        
        # Mouse movement patterns
        self.mouse_patterns = {
            "direct": {"curve": 0.1, "noise": 0.05},
            "curved": {"curve": 0.3, "noise": 0.1},
            "hesitant": {"curve": 0.5, "noise": 0.2}
        }
    
    def _initialize_behavior_patterns(self) -> List[BehaviorPattern]:
        """Initialize human behavior patterns."""
        patterns = [
            BehaviorPattern(
                "scroll_and_read",
                [
                    {"action": "scroll", "direction": "down", "amount": "random"},
                    {"action": "wait", "duration": (2, 5)},
                    {"action": "scroll", "direction": "up", "amount": "small"},
                    {"action": "wait", "duration": (1, 3)}
                ],
                probability=0.3
            ),
            BehaviorPattern(
                "mouse_hover",
                [
                    {"action": "move_mouse", "target": "random_element"},
                    {"action": "wait", "duration": (0.5, 2)},
                    {"action": "move_mouse", "target": "another_element"}
                ],
                probability=0.2
            ),
            BehaviorPattern(
                "tab_navigation",
                [
                    {"action": "key_press", "key": "Tab"},
                    {"action": "wait", "duration": (0.3, 1)},
                    {"action": "key_press", "key": "Tab"},
                    {"action": "wait", "duration": (0.3, 1)}
                ],
                probability=0.15
            ),
            BehaviorPattern(
                "page_interaction",
                [
                    {"action": "click", "target": "background"},
                    {"action": "wait", "duration": (1, 2)},
                    {"action": "key_press", "key": "Escape"}
                ],
                probability=0.1
            )
        ]
        return patterns
    
    def _generate_session_fingerprint(self) -> Dict[str, str]:
        """Generate a unique session fingerprint."""
        return {
            "session_id": f"session_{random.randint(100000, 999999)}",
            "browser_version": f"Chrome/{random.randint(100, 120)}.0.{random.randint(1000, 9999)}.{random.randint(100, 999)}",
            "platform": random.choice(["Win32", "MacIntel", "Linux x86_64"]),
            "language": random.choice(["en-US", "en-GB", "en-CA"]),
            "timezone": random.choice(["America/New_York", "America/Los_Angeles", "Europe/London"])
        }
    
    async def apply_stealth_measures(self, driver: webdriver.Chrome) -> None:
        """Apply comprehensive stealth measures to the browser."""
        try:
            # Remove webdriver property
            driver.execute_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            """)
            
            # Override navigator properties
            driver.execute_script(f"""
                Object.defineProperty(navigator, 'languages', {{
                    get: () => ['{self.session_fingerprint["language"]}'],
                }});
                
                Object.defineProperty(navigator, 'platform', {{
                    get: () => '{self.session_fingerprint["platform"]}',
                }});
                
                Object.defineProperty(navigator, 'hardwareConcurrency', {{
                    get: () => {random.randint(4, 16)},
                }});
                
                Object.defineProperty(navigator, 'deviceMemory', {{
                    get: () => {random.choice([4, 8, 16])},
                }});
            """)
            
            # Override screen properties
            driver.execute_script(f"""
                Object.defineProperty(screen, 'width', {{
                    get: () => {random.choice([1920, 1366, 1440, 2560])},
                }});
                
                Object.defineProperty(screen, 'height', {{
                    get: () => {random.choice([1080, 768, 900, 1440])},
                }});
                
                Object.defineProperty(screen, 'colorDepth', {{
                    get: () => 24,
                }});
            """)
            
            # Override Date.prototype.getTimezoneOffset
            driver.execute_script("""
                const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
                Date.prototype.getTimezoneOffset = function() {
                    return -300; // EST timezone offset
                };
            """)
            
            # Override WebGL fingerprinting
            driver.execute_script("""
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === 37445) {
                        return 'Intel Inc.';
                    }
                    if (parameter === 37446) {
                        return 'Intel(R) Iris(TM) Graphics 6100';
                    }
                    return getParameter.call(this, parameter);
                };
            """)
            
            # Override canvas fingerprinting
            driver.execute_script("""
                const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                HTMLCanvasElement.prototype.toDataURL = function() {
                    const context = this.getContext('2d');
                    if (context) {
                        context.fillStyle = 'rgba(255, 255, 255, 0.01)';
                        context.fillRect(0, 0, 1, 1);
                    }
                    return originalToDataURL.apply(this, arguments);
                };
            """)
            
            self.logger.debug("Stealth measures applied successfully")
            
        except Exception as e:
            self.logger.error(f"Error applying stealth measures: {e}")
    
    async def simulate_human_behavior(self, driver: webdriver.Chrome) -> None:
        """Simulate random human behavior patterns."""
        try:
            # Select a random behavior pattern
            pattern = random.choices(
                self.behavior_patterns,
                weights=[p.probability for p in self.behavior_patterns]
            )[0]
            
            if random.random() < pattern.probability:
                await self._execute_behavior_pattern(driver, pattern)
                
        except Exception as e:
            self.logger.debug(f"Error simulating human behavior: {e}")
    
    async def _execute_behavior_pattern(self, driver: webdriver.Chrome, pattern: BehaviorPattern) -> None:
        """Execute a specific behavior pattern."""
        self.logger.debug(f"Executing behavior pattern: {pattern.name}")
        
        for action in pattern.actions:
            try:
                action_type = action["action"]
                
                if action_type == "scroll":
                    await self._simulate_scroll(driver, action)
                elif action_type == "move_mouse":
                    await self._simulate_mouse_movement(driver, action)
                elif action_type == "click":
                    await self._simulate_click(driver, action)
                elif action_type == "key_press":
                    await self._simulate_key_press(driver, action)
                elif action_type == "wait":
                    await self._simulate_wait(action)
                    
            except Exception as e:
                self.logger.debug(f"Error executing action {action_type}: {e}")
                break
    
    async def _simulate_scroll(self, driver: webdriver.Chrome, action: Dict) -> None:
        """Simulate human-like scrolling."""
        direction = action.get("direction", "down")
        amount = action.get("amount", "random")
        
        if amount == "random":
            scroll_amount = random.randint(100, 500)
        elif amount == "small":
            scroll_amount = random.randint(50, 150)
        else:
            scroll_amount = int(amount)
        
        if direction == "down":
            scroll_amount = -scroll_amount
        
        # Simulate gradual scrolling
        steps = random.randint(3, 8)
        step_amount = scroll_amount // steps
        
        for _ in range(steps):
            driver.execute_script(f"window.scrollBy(0, {step_amount});")
            await asyncio.sleep(random.uniform(0.05, 0.15))
    
    async def _simulate_mouse_movement(self, driver: webdriver.Chrome, action: Dict) -> None:
        """Simulate human-like mouse movement."""
        target = action.get("target", "random_element")
        
        try:
            if target == "random_element":
                elements = driver.find_elements(By.TAG_NAME, "div")[:10]  # Limit to first 10
                if elements:
                    element = random.choice(elements)
                    actions = ActionChains(driver)
                    actions.move_to_element(element)
                    actions.perform()
            elif target == "another_element":
                elements = driver.find_elements(By.TAG_NAME, "span")[:10]
                if elements:
                    element = random.choice(elements)
                    actions = ActionChains(driver)
                    actions.move_to_element(element)
                    actions.perform()
                    
        except Exception as e:
            self.logger.debug(f"Mouse movement simulation failed: {e}")
    
    async def _simulate_click(self, driver: webdriver.Chrome, action: Dict) -> None:
        """Simulate human-like clicking."""
        target = action.get("target", "background")
        
        try:
            if target == "background":
                # Click on a safe area of the page
                body = driver.find_element(By.TAG_NAME, "body")
                actions = ActionChains(driver)
                actions.move_to_element_with_offset(body, 100, 100)
                actions.click()
                actions.perform()
                
        except Exception as e:
            self.logger.debug(f"Click simulation failed: {e}")
    
    async def _simulate_key_press(self, driver: webdriver.Chrome, action: Dict) -> None:
        """Simulate key press."""
        key = action.get("key", "Tab")
        
        try:
            actions = ActionChains(driver)
            if key == "Tab":
                actions.send_keys(Keys.TAB)
            elif key == "Escape":
                actions.send_keys(Keys.ESCAPE)
            actions.perform()
            
        except Exception as e:
            self.logger.debug(f"Key press simulation failed: {e}")
    
    async def _simulate_wait(self, action: Dict) -> None:
        """Simulate human-like waiting."""
        duration = action.get("duration", (1, 3))
        
        if isinstance(duration, tuple):
            wait_time = random.uniform(duration[0], duration[1])
        else:
            wait_time = float(duration)
        
        await asyncio.sleep(wait_time)
    
    async def human_like_typing(self, element, text: str, typing_style: str = "normal") -> None:
        """Type text with human-like patterns."""
        pattern = self.typing_patterns.get(typing_style, self.typing_patterns["normal"])
        
        # Clear the element first
        element.clear()
        
        # Type character by character with human-like delays
        for i, char in enumerate(text):
            element.send_keys(char)
            
            # Calculate delay with variance
            base_delay = random.uniform(pattern["min"], pattern["max"])
            variance = random.uniform(-pattern["variance"], pattern["variance"])
            delay = max(0.01, base_delay + variance)
            
            # Add occasional longer pauses (thinking time)
            if random.random() < 0.1:  # 10% chance
                delay += random.uniform(0.5, 1.5)
            
            # Add typo simulation occasionally
            if random.random() < 0.02 and i < len(text) - 1:  # 2% chance, not on last char
                # Type wrong character then backspace
                wrong_char = random.choice("abcdefghijklmnopqrstuvwxyz")
                element.send_keys(wrong_char)
                await asyncio.sleep(random.uniform(0.1, 0.3))
                element.send_keys(Keys.BACKSPACE)
                await asyncio.sleep(random.uniform(0.1, 0.2))
            
            await asyncio.sleep(delay)
    
    def get_random_user_agent(self) -> str:
        """Get a random but realistic user agent."""
        # Use a curated list of common user agents
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        ]
        
        return random.choice(user_agents)
    
    async def add_random_delays(self, min_delay: float = 1.0, max_delay: float = 3.0) -> None:
        """Add random delays with human-like patterns."""
        # Base delay
        delay = random.uniform(min_delay, max_delay)
        
        # Add occasional longer delays (distraction simulation)
        if random.random() < 0.05:  # 5% chance
            delay += random.uniform(5, 15)
        
        await asyncio.sleep(delay)
    
    def configure_chrome_options(self) -> Options:
        """Configure Chrome options with advanced anti-detection."""
        options = Options()
        
        # Basic stealth options
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Advanced anti-detection options
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        options.add_argument("--disable-extensions-file-access-check")
        options.add_argument("--disable-extensions-http-throttling")
        options.add_argument("--disable-extensions-except")
        options.add_argument("--disable-component-extensions-with-background-pages")
        options.add_argument("--disable-default-apps")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        options.add_argument("--disable-field-trial-config")
        options.add_argument("--disable-back-forward-cache")
        options.add_argument("--disable-background-networking")
        options.add_argument("--disable-sync")
        options.add_argument("--disable-translate")
        options.add_argument("--hide-scrollbars")
        options.add_argument("--mute-audio")
        options.add_argument("--no-first-run")
        options.add_argument("--safebrowsing-disable-auto-update")
        options.add_argument("--disable-client-side-phishing-detection")
        options.add_argument("--disable-component-update")
        options.add_argument("--disable-domain-reliability")
        
        # User agent
        user_agent = self.get_random_user_agent()
        options.add_argument(f"--user-agent={user_agent}")
        
        # Window size with slight randomization
        width = self.config.window_width + random.randint(-50, 50)
        height = self.config.window_height + random.randint(-50, 50)
        options.add_argument(f"--window-size={width},{height}")
        
        # Headless mode
        if self.config.headless:
            options.add_argument("--headless=new")
        
        # Performance optimizations
        if self.config.disable_images:
            prefs = {"profile.managed_default_content_settings.images": 2}
            options.add_experimental_option("prefs", prefs)
        
        return options
