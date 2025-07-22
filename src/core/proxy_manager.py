"""Proxy management system with rotation, health checking, and failover."""

import asyncio
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

import aiohttp
import requests
from sqlalchemy.orm import Session

from ..database.models import Proxy, ProxyStatus
from ..database.repositories import ProxyRepository
from ..utils.config import ProxyConfig
from ..utils.logging import LoggerMixin


class ProxyHealthChecker(LoggerMixin):
    """Health checker for proxy servers."""
    
    def __init__(self, config: ProxyConfig):
        self.config = config
        self.test_urls = [
            "http://httpbin.org/ip",
            "https://api.ipify.org?format=json",
            "http://icanhazip.com"
        ]
    
    async def check_proxy_health(self, proxy: Proxy) -> Tuple[bool, float, Optional[str]]:
        """Check if a proxy is healthy and measure response time."""
        start_time = time.time()
        
        try:
            proxy_url = self._build_proxy_url(proxy)
            
            # Test with aiohttp for async operation
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                # Use proxy for the request
                proxy_dict = {"http": proxy_url, "https": proxy_url}
                
                # Try to access a test URL
                test_url = random.choice(self.test_urls)
                
                async with session.get(test_url, proxy=proxy_url) as response:
                    if response.status == 200:
                        response_time = (time.time() - start_time) * 1000  # Convert to ms
                        
                        # Verify the response contains expected data
                        text = await response.text()
                        if "ip" in text.lower() or any(char.isdigit() for char in text):
                            self.logger.debug(
                                "Proxy health check passed",
                                proxy_id=proxy.id,
                                response_time=response_time
                            )
                            return True, response_time, None
                        else:
                            return False, response_time, "Invalid response content"
                    else:
                        return False, (time.time() - start_time) * 1000, f"HTTP {response.status}"
        
        except asyncio.TimeoutError:
            return False, (time.time() - start_time) * 1000, "Timeout"
        except Exception as e:
            return False, (time.time() - start_time) * 1000, str(e)
    
    def _build_proxy_url(self, proxy: Proxy) -> str:
        """Build proxy URL from proxy object."""
        if proxy.username and proxy.password_encrypted:
            # Decrypt password (this would need the password manager)
            # For now, assume password is stored in plain text for health checks
            auth = f"{proxy.username}:{proxy.password_encrypted}@"
        else:
            auth = ""
        
        return f"{proxy.proxy_type}://{auth}{proxy.host}:{proxy.port}"
    
    async def batch_health_check(self, proxies: List[Proxy]) -> Dict[int, Tuple[bool, float, Optional[str]]]:
        """Perform health checks on multiple proxies concurrently."""
        tasks = []
        for proxy in proxies:
            task = asyncio.create_task(self.check_proxy_health(proxy))
            tasks.append((proxy.id, task))
        
        results = {}
        for proxy_id, task in tasks:
            try:
                result = await task
                results[proxy_id] = result
            except Exception as e:
                self.logger.error(f"Health check failed for proxy {proxy_id}: {e}")
                results[proxy_id] = (False, 0.0, str(e))
        
        return results


class ProxyRotationStrategy:
    """Base class for proxy rotation strategies."""
    
    def select_proxy(self, proxies: List[Proxy]) -> Optional[Proxy]:
        """Select a proxy from the available list."""
        raise NotImplementedError


class RoundRobinStrategy(ProxyRotationStrategy):
    """Round-robin proxy selection strategy."""
    
    def __init__(self):
        self.current_index = 0
    
    def select_proxy(self, proxies: List[Proxy]) -> Optional[Proxy]:
        """Select proxy using round-robin strategy."""
        if not proxies:
            return None
        
        proxy = proxies[self.current_index % len(proxies)]
        self.current_index += 1
        return proxy


class RandomStrategy(ProxyRotationStrategy):
    """Random proxy selection strategy."""
    
    def select_proxy(self, proxies: List[Proxy]) -> Optional[Proxy]:
        """Select proxy randomly."""
        if not proxies:
            return None
        return random.choice(proxies)


class WeightedStrategy(ProxyRotationStrategy):
    """Weighted proxy selection based on performance."""
    
    def select_proxy(self, proxies: List[Proxy]) -> Optional[Proxy]:
        """Select proxy based on weights (success rate and response time)."""
        if not proxies:
            return None
        
        # Calculate weights based on success rate and inverse response time
        weights = []
        for proxy in proxies:
            # Higher success rate = higher weight
            success_weight = proxy.success_rate if proxy.success_rate > 0 else 0.1
            
            # Lower response time = higher weight
            time_weight = 1.0 / (proxy.response_time_ms + 1) if proxy.response_time_ms else 1.0
            
            # Combine weights
            total_weight = success_weight * time_weight * proxy.weight
            weights.append(total_weight)
        
        # Select based on weights
        return random.choices(proxies, weights=weights)[0]


class ProxyManager(LoggerMixin):
    """Main proxy management system."""
    
    def __init__(self, config: ProxyConfig, proxy_repo: ProxyRepository, session: Session):
        self.config = config
        self.proxy_repo = proxy_repo
        self.session = session
        self.health_checker = ProxyHealthChecker(config)
        
        # Initialize rotation strategy
        self.rotation_strategy = self._create_rotation_strategy()
        
        # Track proxy usage
        self.proxy_usage: Dict[int, int] = {}
        
        # Start health check task if enabled
        if self.config.enabled:
            asyncio.create_task(self._periodic_health_check())
    
    def _create_rotation_strategy(self) -> ProxyRotationStrategy:
        """Create the appropriate rotation strategy."""
        strategy_map = {
            "round_robin": RoundRobinStrategy,
            "random": RandomStrategy,
            "weighted": WeightedStrategy
        }
        
        strategy_class = strategy_map.get(self.config.rotation_strategy, RoundRobinStrategy)
        return strategy_class()
    
    async def get_proxy(self) -> Optional[str]:
        """Get an available proxy URL."""
        if not self.config.enabled:
            return None
        
        # Get active proxies
        active_proxies = self.proxy_repo.get_active_proxies()
        
        if not active_proxies:
            self.logger.warning("No active proxies available")
            return None
        
        # Filter proxies that haven't reached max usage
        available_proxies = [
            proxy for proxy in active_proxies
            if proxy.current_usage < proxy.max_concurrent_usage
        ]
        
        if not available_proxies:
            self.logger.warning("All proxies at maximum usage")
            return None
        
        # Select proxy using rotation strategy
        selected_proxy = self.rotation_strategy.select_proxy(available_proxies)
        
        if selected_proxy:
            # Increment usage
            self.proxy_repo.increment_usage(selected_proxy.id)
            self.session.commit()
            
            proxy_url = self._build_proxy_url(selected_proxy)
            
            self.logger.info(
                "Proxy assigned",
                proxy_id=selected_proxy.id,
                host=selected_proxy.host,
                current_usage=selected_proxy.current_usage + 1
            )
            
            return proxy_url
        
        return None
    
    async def release_proxy(self, proxy_url: str) -> None:
        """Release a proxy back to the pool."""
        # Parse proxy URL to find the proxy
        parsed = urlparse(proxy_url)
        host = parsed.hostname
        port = parsed.port
        
        proxy = self.proxy_repo.get_by_host_port(host, port)
        if proxy:
            self.proxy_repo.decrement_usage(proxy.id)
            self.session.commit()
            
            self.logger.info(
                "Proxy released",
                proxy_id=proxy.id,
                host=host,
                current_usage=max(0, proxy.current_usage - 1)
            )
    
    def _build_proxy_url(self, proxy: Proxy) -> str:
        """Build proxy URL from proxy object."""
        if proxy.username and proxy.password_encrypted:
            # In a real implementation, decrypt the password here
            auth = f"{proxy.username}:{proxy.password_encrypted}@"
        else:
            auth = ""
        
        return f"{proxy.proxy_type}://{auth}{proxy.host}:{proxy.port}"
    
    async def add_proxy(
        self,
        host: str,
        port: int,
        proxy_type: str = "http",
        username: Optional[str] = None,
        password: Optional[str] = None,
        max_concurrent_usage: int = 5,
        weight: float = 1.0
    ) -> Proxy:
        """Add a new proxy to the system."""
        # Check if proxy already exists
        existing_proxy = self.proxy_repo.get_by_host_port(host, port)
        if existing_proxy:
            self.logger.warning(f"Proxy {host}:{port} already exists")
            return existing_proxy
        
        # Create new proxy
        proxy_data = {
            "host": host,
            "port": port,
            "proxy_type": proxy_type,
            "username": username,
            "max_concurrent_usage": max_concurrent_usage,
            "weight": weight,
            "status": ProxyStatus.INACTIVE
        }
        
        if password:
            # In a real implementation, encrypt the password here
            proxy_data["password_encrypted"] = password
        
        proxy = self.proxy_repo.create(**proxy_data)
        self.session.commit()
        
        # Test the proxy
        is_healthy, response_time, error = await self.health_checker.check_proxy_health(proxy)
        
        if is_healthy:
            proxy.status = ProxyStatus.ACTIVE
            proxy.response_time_ms = response_time
            proxy.success_rate = 1.0
            proxy.total_requests = 1
            proxy.successful_requests = 1
        else:
            proxy.status = ProxyStatus.FAILED
            self.logger.warning(f"New proxy failed health check: {error}")
        
        proxy.last_checked_at = datetime.utcnow()
        self.session.commit()
        
        self.logger.info(
            "Proxy added",
            proxy_id=proxy.id,
            host=host,
            port=port,
            status=proxy.status.value
        )
        
        return proxy
    
    async def remove_proxy(self, proxy_id: int) -> bool:
        """Remove a proxy from the system."""
        proxy = self.proxy_repo.get_by_id(proxy_id)
        if not proxy:
            return False
        
        # Check if proxy is currently in use
        if proxy.current_usage > 0:
            self.logger.warning(
                f"Cannot remove proxy {proxy_id} - currently in use ({proxy.current_usage} connections)"
            )
            return False
        
        success = self.proxy_repo.delete(proxy_id)
        if success:
            self.session.commit()
            self.logger.info(f"Proxy {proxy_id} removed successfully")
        
        return success
    
    async def _periodic_health_check(self) -> None:
        """Periodic health check for all proxies."""
        while True:
            try:
                await asyncio.sleep(self.config.health_check_interval)
                
                self.logger.info("Starting periodic proxy health check")
                
                # Get all proxies (active and inactive)
                all_proxies = self.proxy_repo.get_all()
                
                if not all_proxies:
                    continue
                
                # Perform batch health check
                results = await self.health_checker.batch_health_check(all_proxies)
                
                # Update proxy statuses
                for proxy_id, (is_healthy, response_time, error) in results.items():
                    proxy = self.proxy_repo.get_by_id(proxy_id)
                    if proxy:
                        # Update statistics
                        self.proxy_repo.update_proxy_stats(proxy_id, response_time, is_healthy)
                        
                        # Update status
                        if is_healthy:
                            if proxy.status == ProxyStatus.FAILED:
                                proxy.status = ProxyStatus.ACTIVE
                                self.logger.info(f"Proxy {proxy_id} recovered")
                        else:
                            if proxy.status == ProxyStatus.ACTIVE:
                                proxy.status = ProxyStatus.FAILED
                                self.logger.warning(f"Proxy {proxy_id} failed: {error}")
                
                self.session.commit()
                
                # Log summary
                active_count = len([p for p in all_proxies if p.status == ProxyStatus.ACTIVE])
                failed_count = len([p for p in all_proxies if p.status == ProxyStatus.FAILED])
                
                self.logger.info(
                    "Health check completed",
                    total_proxies=len(all_proxies),
                    active=active_count,
                    failed=failed_count
                )
                
            except Exception as e:
                self.logger.error(f"Error in periodic health check: {e}")
    
    async def get_proxy_statistics(self) -> Dict[str, any]:
        """Get proxy usage statistics."""
        all_proxies = self.proxy_repo.get_all()
        
        stats = {
            "total_proxies": len(all_proxies),
            "active_proxies": len([p for p in all_proxies if p.status == ProxyStatus.ACTIVE]),
            "failed_proxies": len([p for p in all_proxies if p.status == ProxyStatus.FAILED]),
            "total_usage": sum(p.current_usage for p in all_proxies),
            "average_response_time": 0,
            "average_success_rate": 0
        }
        
        if all_proxies:
            active_proxies = [p for p in all_proxies if p.status == ProxyStatus.ACTIVE and p.response_time_ms]
            if active_proxies:
                stats["average_response_time"] = sum(p.response_time_ms for p in active_proxies) / len(active_proxies)
                stats["average_success_rate"] = sum(p.success_rate for p in active_proxies) / len(active_proxies)
        
        return stats
