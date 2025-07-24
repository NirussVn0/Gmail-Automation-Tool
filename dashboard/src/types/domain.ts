import { Entity, ValueObject } from './core';

export interface GmailAccount extends Entity {
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  recoveryEmail?: string;
  phoneNumber?: string;
  status: AccountStatus;
  proxyId?: string;
  creationJobId?: string;
  lastLoginAt?: Date;
  isVerified: boolean;
  verificationToken?: string;
}

export enum AccountStatus {
  PENDING = 'pending',
  CREATING = 'creating',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  FAILED = 'failed',
  DELETED = 'deleted'
}

export interface Proxy extends Entity {
  host: string;
  port: number;
  type: ProxyType;
  username?: string;
  password?: string;
  isActive: boolean;
  maxConcurrentUsage: number;
  currentUsage: number;
  weight: number;
  country?: string;
  region?: string;
  lastHealthCheck?: Date;
  healthStatus: HealthStatus;
}

export enum ProxyType {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS5 = 'socks5'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

export interface CreationJob extends Entity {
  name: string;
  description?: string;
  status: JobStatus;
  totalAccounts: number;
  completedAccounts: number;
  failedAccounts: number;
  configuration: CreationConfiguration;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  progress: number;
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface CreationConfiguration {
  baseName: string;
  startingId: number;
  batchSize: number;
  delayMin: number;
  delayMax: number;
  useProxy: boolean;
  proxyRotation: boolean;
  enableSmsVerification: boolean;
  smsService?: string;
  webDriverConfig: WebDriverConfiguration;
}

export interface WebDriverConfiguration {
  headless: boolean;
  windowWidth: number;
  windowHeight: number;
  pageLoadTimeout: number;
  implicitWait: number;
  userAgentRotation: boolean;
  disableImages: boolean;
  disableJavaScript: boolean;
}

export interface VerificationSession extends Entity {
  phoneNumber: string;
  serviceName: string;
  sessionId: string;
  status: VerificationStatus;
  code?: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export enum VerificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export interface SystemConfiguration {
  security: SecurityConfig;
  database: DatabaseConfig;
  proxy: ProxyConfig;
  sms: SmsConfig;
  webDriver: WebDriverConfig;
  logging: LoggingConfig;
}

export interface SecurityConfig {
  secretKey: string;
  encryptionKey: string;
  passwordSalt: string;
  jwtAlgorithm: string;
  jwtExpirationHours: number;
}

export interface DatabaseConfig {
  url: string;
  echo: boolean;
  poolSize: number;
  maxOverflow: number;
}

export interface ProxyConfig {
  enabled: boolean;
  rotationStrategy: string;
  healthCheckInterval: number;
  timeout: number;
  maxRetries: number;
}

export interface SmsConfig {
  servicePrimary: string;
  serviceApiKey: string;
  serviceBackup?: string;
  serviceBackupApiKey?: string;
}

export interface WebDriverConfig {
  headless: boolean;
  windowWidth: number;
  windowHeight: number;
  pageLoadTimeout: number;
  implicitWait: number;
  userAgentRotation: boolean;
  disableImages: boolean;
  disableJavaScript: boolean;
}

export interface LoggingConfig {
  level: string;
  format: string;
  filePath: string;
  maxFileSize: number;
  backupCount: number;
}

export class Email implements ValueObject<Email> {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export class PhoneNumber implements ValueObject<PhoneNumber> {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid phone number format');
    }
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }

  private isValid(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  }
}
