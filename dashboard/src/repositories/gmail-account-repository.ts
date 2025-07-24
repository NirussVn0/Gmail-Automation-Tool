import { GmailAccount, AccountStatus } from '@/types/domain';
import { BaseRepository } from './base-repository';
import { Result } from '@/types/core';

export interface GmailAccountRepository {
  findByStatus(status: AccountStatus): Promise<GmailAccount[]>;
  findByCreationJob(jobId: string): Promise<GmailAccount[]>;
  bulkCreate(accounts: Partial<GmailAccount>[]): Promise<Result<GmailAccount[]>>;
  bulkDelete(ids: string[]): Promise<Result<void>>;
  updateStatus(id: string, status: AccountStatus): Promise<Result<GmailAccount>>;
  getStatistics(): Promise<AccountStatistics>;
}

export interface AccountStatistics {
  total: number;
  byStatus: Record<AccountStatus, number>;
  createdToday: number;
  createdThisWeek: number;
  createdThisMonth: number;
  successRate: number;
}

export class GmailAccountRepositoryImpl extends BaseRepository<GmailAccount> implements GmailAccountRepository {
  protected endpoint = '/api/accounts';

  async findByStatus(status: AccountStatus): Promise<GmailAccount[]> {
    return this.findWithQuery({ status });
  }

  async findByCreationJob(jobId: string): Promise<GmailAccount[]> {
    return this.findWithQuery({ creation_job_id: jobId });
  }

  async bulkCreate(accounts: Partial<GmailAccount>[]): Promise<Result<GmailAccount[]>> {
    return this.executeAction('bulk-create', { accounts });
  }

  async bulkDelete(ids: string[]): Promise<Result<void>> {
    return this.executeAction('bulk-delete', { ids });
  }

  async updateStatus(id: string, status: AccountStatus): Promise<Result<GmailAccount>> {
    return this.executeAction(`${id}/status`, { status });
  }

  async getStatistics(): Promise<AccountStatistics> {
    try {
      const response = await this.httpClient.get<AccountStatistics>(`${this.endpoint}/statistics`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get account statistics', error as Error);
      return {
        total: 0,
        byStatus: {} as Record<AccountStatus, number>,
        createdToday: 0,
        createdThisWeek: 0,
        createdThisMonth: 0,
        successRate: 0,
      };
    }
  }

  async exportAccounts(filters?: {
    status?: AccountStatus;
    dateFrom?: Date;
    dateTo?: Date;
    format?: 'csv' | 'json';
  }): Promise<Result<Blob>> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.dateFrom) queryParams.append('date_from', filters.dateFrom.toISOString());
      if (filters?.dateTo) queryParams.append('date_to', filters.dateTo.toISOString());
      if (filters?.format) queryParams.append('format', filters.format);

      const response = await fetch(`${this.endpoint}/export?${queryParams.toString()}`);
      const blob = await response.blob();

      return { success: true, data: blob };
    } catch (error) {
      this.logger.error('Failed to export accounts', error as Error, { filters });
      return { success: false, error: error as Error };
    }
  }

  async searchAccounts(query: {
    search?: string;
    status?: AccountStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    accounts: GmailAccount[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await this.httpClient.get<{
        accounts: GmailAccount[];
        total: number;
        page: number;
        total_pages: number;
      }>(`${this.endpoint}/search`, { 
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        accounts: response.data.accounts,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.total_pages,
      };
    } catch (error) {
      this.logger.error('Failed to search accounts', error as Error, { query });
      return {
        accounts: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }
}
