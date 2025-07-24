'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountsTable } from '@/components/accounts/accounts-table';
import { AccountsFilters } from '@/components/accounts/accounts-filters';
import { BulkActions } from '@/components/accounts/bulk-actions';
import { GmailAccount, AccountStatus } from '@/types/domain';
import { toast } from '@/components/ui/toaster';
import {
  PlusCircleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AccountsPageState {
  accounts: GmailAccount[];
  selectedAccounts: string[];
  filters: {
    status?: AccountStatus;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  showFilters: boolean;
}

export default function AccountsPage() {
  const [state, setState] = useState<AccountsPageState>({
    accounts: [],
    selectedAccounts: [],
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    loading: true,
    showFilters: false,
  });

  useEffect(() => {
    loadAccounts();
  }, [state.filters, state.pagination.page]);

  const loadAccounts = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const mockAccounts: GmailAccount[] = Array.from({ length: 20 }, (_, i) => ({
        id: `account-${i + 1}`,
        email: `user${i + 1}@gmail.com`,
        firstName: `User${i + 1}`,
        lastName: 'Generated',
        status: [
          AccountStatus.ACTIVE,
          AccountStatus.PENDING,
          AccountStatus.FAILED,
          AccountStatus.SUSPENDED,
        ][i % 4],
        isVerified: Math.random() > 0.3,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        proxyId: Math.random() > 0.5 ? `proxy-${Math.floor(Math.random() * 10)}` : undefined,
        creationJobId: Math.random() > 0.7 ? `job-${Math.floor(Math.random() * 5)}` : undefined,
      }));

      setState(prev => ({
        ...prev,
        accounts: mockAccounts,
        pagination: {
          ...prev.pagination,
          total: 247,
          totalPages: Math.ceil(247 / prev.pagination.limit),
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Failed to load accounts', 'Please try again later');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFilterChange = (filters: typeof state.filters) => {
    setState(prev => ({
      ...prev,
      filters,
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setState(prev => ({ ...prev, selectedAccounts: selectedIds }));
  };

  const handleBulkAction = async (action: string, accountIds: string[]) => {
    try {
      switch (action) {
        case 'delete':
          toast.success('Accounts deleted', `${accountIds.length} accounts deleted successfully`);
          break;
        case 'activate':
          toast.success('Accounts activated', `${accountIds.length} accounts activated`);
          break;
        case 'suspend':
          toast.warning('Accounts suspended', `${accountIds.length} accounts suspended`);
          break;
        case 'export':
          toast.info('Export started', 'Your export will be ready shortly');
          break;
      }
      
      setState(prev => ({ ...prev, selectedAccounts: [] }));
      await loadAccounts();
    } catch (error) {
      toast.error('Action failed', 'Please try again later');
    }
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  };

  const handleExport = async () => {
    try {
      toast.info('Export started', 'Your file will be downloaded shortly');
      
      const csvContent = [
        'Email,First Name,Last Name,Status,Created At,Verified',
        ...state.accounts.map(account => 
          `${account.email},${account.firstName},${account.lastName},${account.status},${account.createdAt.toISOString()},${account.isVerified}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gmail-accounts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Export failed', 'Please try again later');
    }
  };

  const stats = {
    total: state.pagination.total,
    active: state.accounts.filter(a => a.status === AccountStatus.ACTIVE).length,
    pending: state.accounts.filter(a => a.status === AccountStatus.PENDING).length,
    failed: state.accounts.filter(a => a.status === AccountStatus.FAILED).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gmail Accounts</h1>
          <p className="text-muted-foreground">
            Manage and monitor your Gmail accounts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
          >
            <FunnelIcon className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/create">
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Create Accounts
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {state.showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter accounts by status, date, or search term</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountsFilters
              filters={state.filters}
              onFiltersChange={handleFilterChange}
            />
          </CardContent>
        </Card>
      )}

      {state.selectedAccounts.length > 0 && (
        <BulkActions
          selectedCount={state.selectedAccounts.length}
          onAction={(action) => handleBulkAction(action, state.selectedAccounts)}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <AccountsTable
            accounts={state.accounts}
            selectedAccounts={state.selectedAccounts}
            onSelectionChange={handleSelectionChange}
            loading={state.loading}
            pagination={state.pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
