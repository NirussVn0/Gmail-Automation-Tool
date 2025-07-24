export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValueObject<T> {
  equals(other: T): boolean;
  getValue(): any;
}

export interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

export interface EventHandler<T> {
  handle(event: T): Promise<void>;
}

export interface DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  errors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface Validator<T> {
  validate(data: T): ValidationResult;
}

export interface Mapper<TSource, TTarget> {
  map(source: TSource): TTarget;
  mapArray(sources: TSource[]): TTarget[];
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface NotificationService {
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
}

export interface WebSocketService {
  connect(url: string): void;
  disconnect(): void;
  subscribe<T>(event: string, handler: (data: T) => void): void;
  unsubscribe(event: string): void;
  emit<T>(event: string, data: T): void;
}

export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

export interface Command {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface Query {
  type: string;
  parameters: any;
}

export interface CommandHandler<T extends Command> {
  handle(command: T): Promise<Result<any>>;
}

export interface QueryHandler<T extends Query, R> {
  handle(query: T): Promise<Result<R>>;
}
