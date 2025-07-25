# API Documentation

## Overview

The Gmail Automation Tool provides a comprehensive REST API for managing Gmail account creation, monitoring, and configuration. All endpoints require authentication unless otherwise specified.

## Table of Contents
1. [Authentication](#authentication)
2. [Account Management](#account-management)
3. [Job Management](#job-management)
4. [Proxy Management](#proxy-management)
5. [Configuration Management](#configuration-management)
6. [Analytics](#analytics)
7. [WebSocket Events](#websocket-events)

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password",
  "rememberMe": false
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "permissions": ["accounts:read", "accounts:write"]
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 3600
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {token}

{
  "refreshToken": "refresh-token"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}
```

## Account Management

### List Accounts
```http
GET /accounts?page=1&limit=20&status=active&search=user
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (active, pending, failed, suspended)
- `search` (optional): Search by email or name

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "email": "user1@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active",
      "isVerified": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

### Get Account Details
```http
GET /accounts/{id}
Authorization: Bearer {token}
```

### Create Accounts
```http
POST /accounts/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "configuration": {
    "baseName": "user",
    "startingId": 1,
    "batchSize": 5,
    "delayMin": 2,
    "delayMax": 8,
    "useProxy": true,
    "proxyRotation": true,
    "enableSmsVerification": true,
    "webDriverConfig": {
      "headless": true,
      "windowWidth": 1920,
      "windowHeight": 1080,
      "pageLoadTimeout": 30,
      "implicitWait": 10,
      "userAgentRotation": true,
      "disableImages": true,
      "disableJavaScript": false
    }
  },
  "count": 10
}
```

**Response:**
```json
{
  "id": "job-uuid",
  "name": "Account Creation Job",
  "status": "pending",
  "totalAccounts": 10,
  "completedAccounts": 0,
  "failedAccounts": 0,
  "progress": 0,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Update Account Status
```http
PATCH /accounts/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "suspended"
}
```

### Delete Accounts
```http
POST /accounts/bulk-delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

### Export Accounts
```http
GET /accounts/export?format=csv&status=active
Authorization: Bearer {token}
```

**Query Parameters:**
- `format`: Export format (csv, json)
- `status` (optional): Filter by status
- `dateFrom` (optional): Start date (ISO 8601)
- `dateTo` (optional): End date (ISO 8601)

## Job Management

### List Jobs
```http
GET /jobs?page=1&limit=20&status=running
Authorization: Bearer {token}
```

### Get Job Details
```http
GET /jobs/{id}
Authorization: Bearer {token}
```

### Control Job
```http
POST /jobs/{id}/pause
POST /jobs/{id}/resume
POST /jobs/{id}/cancel
Authorization: Bearer {token}
```

## Proxy Management

### List Proxies
```http
GET /proxies
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "host": "192.168.1.100",
    "port": 8080,
    "type": "http",
    "username": "user",
    "password": "pass",
    "isActive": true,
    "healthStatus": "healthy",
    "lastChecked": "2023-01-01T00:00:00Z",
    "responseTime": 150,
    "usageCount": 25,
    "createdAt": "2023-01-01T00:00:00Z"
  }
]
```

### Add Proxy
```http
POST /proxies
Authorization: Bearer {token}
Content-Type: application/json

{
  "host": "192.168.1.100",
  "port": 8080,
  "type": "http",
  "username": "user",
  "password": "pass",
  "isActive": true
}
```

### Update Proxy
```http
PATCH /proxies/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "isActive": false
}
```

### Test Proxy
```http
POST /proxies/{id}/test
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "responseTime": 150,
  "error": null
}
```

### Delete Proxy
```http
DELETE /proxies/{id}
Authorization: Bearer {token}
```

## Configuration Management

### Get Configuration
```http
GET /config
Authorization: Bearer {token}
```

### Update Configuration
```http
PATCH /config
Authorization: Bearer {token}
Content-Type: application/json

{
  "proxy": {
    "enabled": true,
    "rotationStrategy": "round_robin",
    "healthCheckInterval": 300,
    "timeout": 30,
    "maxRetries": 3
  },
  "sms": {
    "servicePrimary": "textverified",
    "serviceApiKey": "api-key",
    "serviceBackup": "smsactivate",
    "serviceBackupApiKey": "backup-api-key"
  }
}
```

## Analytics

### Get Analytics
```http
GET /analytics?timeRange=7d
Authorization: Bearer {token}
```

**Query Parameters:**
- `timeRange`: Time range (24h, 7d, 30d, 90d)

**Response:**
```json
{
  "overview": {
    "totalAccounts": 1247,
    "successRate": 94.2,
    "avgCreationTime": 45,
    "activeJobs": 3
  },
  "trends": {
    "daily": [
      {
        "date": "2023-01-01",
        "created": 50,
        "failed": 3,
        "successRate": 94.0
      }
    ],
    "hourly": [
      {
        "hour": 0,
        "created": 5,
        "successRate": 95.0
      }
    ]
  },
  "performance": {
    "byProxy": [
      {
        "proxy": "192.168.1.100",
        "accounts": 156,
        "successRate": 96.2,
        "avgTime": 42
      }
    ],
    "byService": [
      {
        "service": "TextVerified",
        "verifications": 234,
        "successRate": 97.8,
        "cost": 47.50
      }
    ]
  }
}
```

### Get Account Statistics
```http
GET /accounts/statistics
Authorization: Bearer {token}
```

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Events

#### Account Updated
```json
{
  "type": "account_updated",
  "data": {
    "id": "uuid",
    "email": "user@gmail.com",
    "status": "active",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

#### Job Progress
```json
{
  "type": "job_progress",
  "data": {
    "jobId": "uuid",
    "progress": 75,
    "completedAccounts": 15,
    "failedAccounts": 1,
    "estimatedCompletion": "2023-01-01T01:00:00Z"
  }
}
```

#### System Notification
```json
{
  "type": "system_notification",
  "data": {
    "level": "info",
    "message": "System maintenance scheduled",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

#### Proxy Status
```json
{
  "type": "proxy_status",
  "data": {
    "proxyId": "uuid",
    "status": "unhealthy",
    "responseTime": null,
    "error": "Connection timeout"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_ERROR` (401): Invalid or missing authentication
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request data
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `SERVER_ERROR` (500): Internal server error

## Rate Limiting

- **Authentication**: 5 requests per minute per IP
- **Account Creation**: 10 requests per hour per user
- **General API**: 1000 requests per hour per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
