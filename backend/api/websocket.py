import asyncio
import json
from datetime import datetime
from typing import Dict, List, Set

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter

from ..utils.logging import get_logger
from .schemas import AccountCreationUpdate, JobProgressUpdate, WebSocketMessage

router = APIRouter()
logger = get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "accounts": set(),
            "jobs": set(),
            "proxies": set(),
            "general": set()
        }
        self.connection_info: Dict[WebSocket, Dict] = {}
    async def connect(self, websocket: WebSocket, channel: str = "general") -> None:
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
        self.connection_info[websocket] = {
            "channel": channel,
            "connected_at": datetime.utcnow(),
            "client_ip": websocket.client.host if websocket.client else "unknown"
        }
        logger.info(
            f"WebSocket connected to {channel}",
            client_ip=self.connection_info[websocket]["client_ip"],
            total_connections=sum(len(conns) for conns in self.active_connections.values())
        )
        await self.send_personal_message(websocket, {
            "type": "connection_established",
            "data": {
                "channel": channel,
                "timestamp": datetime.utcnow().isoformat(),
                "message": f"Connected to {channel} channel"
            }
        })
    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.connection_info:
            channel = self.connection_info[websocket]["channel"]
            client_ip = self.connection_info[websocket]["client_ip"]
            self.active_connections[channel].discard(websocket)
            del self.connection_info[websocket]
            logger.info(
                f"WebSocket disconnected from {channel}",
                client_ip=client_ip,
                total_connections=sum(len(conns) for conns in self.active_connections.values())
            )
    async def send_personal_message(self, websocket: WebSocket, message: dict) -> None:
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    async def broadcast_to_channel(self, channel: str, message: dict) -> None:
        if channel not in self.active_connections:
            return
        disconnected_connections = set()
        for connection in self.active_connections[channel].copy():
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.error(f"Error broadcasting to connection: {e}")
                disconnected_connections.add(connection)
        for connection in disconnected_connections:
            self.disconnect(connection)
    async def broadcast_to_all(self, message: dict) -> None:
        for channel in self.active_connections:
            await self.broadcast_to_channel(channel, message)
    def get_connection_stats(self) -> Dict[str, int]:
        return {
            channel: len(connections)
            for channel, connections in self.active_connections.items()
        }

manager = ConnectionManager()

@router.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await handle_client_message(websocket, message)
            except json.JSONDecodeError:
                await manager.send_personal_message(websocket, {
                    "type": "error",
                    "data": {
                        "message": "Invalid JSON format",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def handle_client_message(websocket: WebSocket, message: dict) -> None:
    message_type = message.get("type")
    if message_type == "ping":
        await manager.send_personal_message(websocket, {
            "type": "pong",
            "data": {
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    elif message_type == "subscribe":
        event_types = message.get("data", {}).get("events", [])
        await manager.send_personal_message(websocket, {
            "type": "subscription_confirmed",
            "data": {
                "events": event_types,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    elif message_type == "get_stats":
        stats = manager.get_connection_stats()
        await manager.send_personal_message(websocket, {
            "type": "stats",
            "data": {
                "connections": stats,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
    else:
        await manager.send_personal_message(websocket, {
            "type": "error",
            "data": {
                "message": f"Unknown message type: {message_type}",
                "timestamp": datetime.utcnow().isoformat()
            }
        })

async def broadcast_account_update(update: AccountCreationUpdate) -> None:
    message = WebSocketMessage(
        type="account_update",
        data=update.dict()
    )
    await manager.broadcast_to_channel("accounts", message.dict())

async def broadcast_job_progress(update: JobProgressUpdate) -> None:
    message = WebSocketMessage(
        type="job_progress",
        data=update.dict()
    )
    await manager.broadcast_to_channel("jobs", message.dict())

async def broadcast_proxy_status(proxy_id: int, status: str, message: str) -> None:
    update_message = WebSocketMessage(
        type="proxy_status",
        data={
            "proxy_id": proxy_id,
            "status": status,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    await manager.broadcast_to_channel("proxies", update_message.dict())

async def broadcast_system_notification(notification_type: str, message: str, level: str = "info") -> None:
    notification = WebSocketMessage(
        type="system_notification",
        data={
            "notification_type": notification_type,
            "message": message,
            "level": level,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    await manager.broadcast_to_all(notification.dict())

async def periodic_stats_broadcast():
    while True:
        try:
            await asyncio.sleep(30)
            connection_stats = manager.get_connection_stats()
            if sum(connection_stats.values()) > 0:
                stats_message = WebSocketMessage(
                    type="periodic_stats",
                    data={
                        "connections": connection_stats,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                await manager.broadcast_to_channel("general", stats_message.dict())
        except Exception as e:
            logger.error(f"Error in periodic stats broadcast: {e}")

asyncio.create_task(periodic_stats_broadcast())
