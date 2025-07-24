import { UseCase, Result, Logger } from '@/types/core';
import { GmailAccount, AccountStatus, CreationConfiguration } from '@/types/domain';
import { GmailAccountRepository } from '@/repositories/gmail-account-repository';
import { container } from '@/lib/container';

export interface CreateAccountsRequest {
  configuration: CreationConfiguration;
  count: number;
}

export interface CreateAccountsResponse {
  jobId: string;
  accounts: GmailAccount[];
}

export class CreateAccountsUseCase implements UseCase<CreateAccountsRequest, CreateAccountsResponse> {
  private accountRepository: GmailAccountRepository;
  private logger: Logger;

  constructor() {
    this.accountRepository = container.resolve<GmailAccountRepository>('GmailAccountRepository');
    this.logger = container.resolve<Logger>('Logger');
  }

  async execute(request: CreateAccountsRequest): Promise<CreateAccountsResponse> {
    this.logger.info('Starting account creation process', { count: request.count });

    try {
      this.validateRequest(request);

      const accounts = this.generateAccountData(request);
      const result = await this.accountRepository.bulkCreate(accounts);

      if (!result.success) {
        throw result.error;
      }

      this.logger.info('Account creation initiated successfully', { 
        count: result.data.length,
        jobId: result.data[0]?.creationJobId 
      });

      return {
        jobId: result.data[0]?.creationJobId || '',
        accounts: result.data,
      };
    } catch (error) {
      this.logger.error('Failed to create accounts', error as Error, request);
      throw error;
    }
  }

  private validateRequest(request: CreateAccountsRequest): void {
    if (request.count <= 0 || request.count > 100) {
      throw new Error('Account count must be between 1 and 100');
    }

    if (!request.configuration.baseName) {
      throw new Error('Base name is required');
    }

    if (request.configuration.delayMin < 0 || request.configuration.delayMax < request.configuration.delayMin) {
      throw new Error('Invalid delay configuration');
    }
  }

  private generateAccountData(request: CreateAccountsRequest): Partial<GmailAccount>[] {
    const accounts: Partial<GmailAccount>[] = [];
    const { configuration, count } = request;

    for (let i = 0; i < count; i++) {
      const accountNumber = configuration.startingId + i;
      const email = `${configuration.baseName}${accountNumber}@gmail.com`;

      accounts.push({
        email,
        firstName: `User${accountNumber}`,
        lastName: 'Generated',
        status: AccountStatus.PENDING,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return accounts;
  }
}

export interface DeleteAccountsRequest {
  accountIds: string[];
  force?: boolean;
}

export class DeleteAccountsUseCase implements UseCase<DeleteAccountsRequest, void> {
  private accountRepository: GmailAccountRepository;
  private logger: Logger;

  constructor() {
    this.accountRepository = container.resolve<GmailAccountRepository>('GmailAccountRepository');
    this.logger = container.resolve<Logger>('Logger');
  }

  async execute(request: DeleteAccountsRequest): Promise<void> {
    this.logger.info('Starting account deletion process', { count: request.accountIds.length });

    try {
      if (!request.force) {
        await this.validateDeletion(request.accountIds);
      }

      const result = await this.accountRepository.bulkDelete(request.accountIds);

      if (!result.success) {
        throw result.error;
      }

      this.logger.info('Accounts deleted successfully', { count: request.accountIds.length });
    } catch (error) {
      this.logger.error('Failed to delete accounts', error as Error, request);
      throw error;
    }
  }

  private async validateDeletion(accountIds: string[]): Promise<void> {
    for (const id of accountIds) {
      const account = await this.accountRepository.findById(id);
      if (account?.status === AccountStatus.CREATING) {
        throw new Error(`Cannot delete account ${id} while it's being created`);
      }
    }
  }
}

export interface UpdateAccountStatusRequest {
  accountId: string;
  status: AccountStatus;
  reason?: string;
}

export class UpdateAccountStatusUseCase implements UseCase<UpdateAccountStatusRequest, GmailAccount> {
  private accountRepository: GmailAccountRepository;
  private logger: Logger;

  constructor() {
    this.accountRepository = container.resolve<GmailAccountRepository>('GmailAccountRepository');
    this.logger = container.resolve<Logger>('Logger');
  }

  async execute(request: UpdateAccountStatusRequest): Promise<GmailAccount> {
    this.logger.info('Updating account status', request);

    try {
      const result = await this.accountRepository.updateStatus(request.accountId, request.status);

      if (!result.success) {
        throw result.error;
      }

      this.logger.info('Account status updated successfully', { 
        accountId: request.accountId, 
        status: request.status 
      });

      return result.data;
    } catch (error) {
      this.logger.error('Failed to update account status', error as Error, request);
      throw error;
    }
  }
}

export interface GetAccountStatisticsRequest {}

export interface GetAccountStatisticsResponse {
  total: number;
  byStatus: Record<AccountStatus, number>;
  createdToday: number;
  createdThisWeek: number;
  createdThisMonth: number;
  successRate: number;
  trends: {
    daily: Array<{ date: string; count: number; success: number }>;
    weekly: Array<{ week: string; count: number; success: number }>;
  };
}

export class GetAccountStatisticsUseCase implements UseCase<GetAccountStatisticsRequest, GetAccountStatisticsResponse> {
  private accountRepository: GmailAccountRepository;
  private logger: Logger;

  constructor() {
    this.accountRepository = container.resolve<GmailAccountRepository>('GmailAccountRepository');
    this.logger = container.resolve<Logger>('Logger');
  }

  async execute(request: GetAccountStatisticsRequest): Promise<GetAccountStatisticsResponse> {
    try {
      const statistics = await this.accountRepository.getStatistics();

      return {
        ...statistics,
        trends: {
          daily: this.generateDailyTrends(),
          weekly: this.generateWeeklyTrends(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get account statistics', error as Error);
      throw error;
    }
  }

  private generateDailyTrends(): Array<{ date: string; count: number; success: number }> {
    const trends = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50),
        success: Math.floor(Math.random() * 45),
      });
    }

    return trends;
  }

  private generateWeeklyTrends(): Array<{ week: string; count: number; success: number }> {
    const trends = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      
      trends.push({
        week: `Week ${date.getWeek()}`,
        count: Math.floor(Math.random() * 300),
        success: Math.floor(Math.random() * 280),
      });
    }

    return trends;
  }
}

declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
