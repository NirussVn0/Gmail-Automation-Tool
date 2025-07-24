import { Repository, Entity, HttpClient, Logger, Result } from '@/types/core';
import { container } from '@/lib/container';

export abstract class BaseRepository<T extends Entity> implements Repository<T> {
  protected httpClient: HttpClient;
  protected logger: Logger;
  protected abstract endpoint: string;

  constructor() {
    this.httpClient = container.resolve<HttpClient>('HttpClient');
    this.logger = container.resolve<Logger>('Logger');
  }

  async findById(id: string): Promise<T | null> {
    try {
      const response = await this.httpClient.get<T>(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to find ${this.endpoint} by id: ${id}`, error as Error);
      return null;
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const response = await this.httpClient.get<T[]>(this.endpoint);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to find all ${this.endpoint}`, error as Error);
      return [];
    }
  }

  async save(entity: T): Promise<T> {
    try {
      const isUpdate = !!entity.id;
      const response = isUpdate
        ? await this.httpClient.put<T>(`${this.endpoint}/${entity.id}`, entity)
        : await this.httpClient.post<T>(this.endpoint, entity);
      
      this.logger.info(`${isUpdate ? 'Updated' : 'Created'} ${this.endpoint}`, { id: entity.id });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to save ${this.endpoint}`, error as Error, { entity });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.httpClient.delete(`${this.endpoint}/${id}`);
      this.logger.info(`Deleted ${this.endpoint}`, { id });
    } catch (error) {
      this.logger.error(`Failed to delete ${this.endpoint}`, error as Error, { id });
      throw error;
    }
  }

  protected async findWithQuery<R = T[]>(query: Record<string, any>): Promise<R> {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await this.httpClient.get<R>(`${this.endpoint}?${queryString}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to find ${this.endpoint} with query`, error as Error, { query });
      throw error;
    }
  }

  protected async executeAction<R>(action: string, data?: any): Promise<Result<R>> {
    try {
      const response = await this.httpClient.post<R>(`${this.endpoint}/${action}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      this.logger.error(`Failed to execute ${action} on ${this.endpoint}`, error as Error, { data });
      return { success: false, error: error as Error };
    }
  }
}

export abstract class CachedRepository<T extends Entity> extends BaseRepository<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async findById(id: string): Promise<T | null> {
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const entity = await super.findById(id);
    if (entity) {
      this.cache.set(id, { data: entity, timestamp: Date.now() });
    }

    return entity;
  }

  async save(entity: T): Promise<T> {
    const saved = await super.save(entity);
    this.cache.set(saved.id, { data: saved, timestamp: Date.now() });
    return saved;
  }

  async delete(id: string): Promise<void> {
    await super.delete(id);
    this.cache.delete(id);
  }

  protected clearCache(): void {
    this.cache.clear();
  }

  protected invalidateCache(id: string): void {
    this.cache.delete(id);
  }
}
