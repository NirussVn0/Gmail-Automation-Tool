'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GmailAccount, AccountStatus } from '@/types/domain';
import { formatDateTime, formatRelativeTime, cn } from '@/lib/utils';
import {
  CheckIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface AccountsTableProps {
  accounts: GmailAccount[];
  selectedAccounts: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function AccountsTable({
  accounts,
  selectedAccounts,
  onSelectionChange,
  loading,
  pagination,
  onPageChange,
}: AccountsTableProps) {
  const [sortField, setSortField] = useState<keyof GmailAccount>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showActions, setShowActions] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(accounts.map(account => account.id));
    }
  };

  const handleSelectAccount = (accountId: string) => {
    if (selectedAccounts.includes(accountId)) {
      onSelectionChange(selectedAccounts.filter(id => id !== accountId));
    } else {
      onSelectionChange([...selectedAccounts, accountId]);
    }
  };

  const handleSort = (field: keyof GmailAccount) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case AccountStatus.ACTIVE:
        return (
          <span className={cn(baseClasses, 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300')}>
            <CheckCircleIcon className="mr-1 h-3 w-3" />
            Active
          </span>
        );
      case AccountStatus.PENDING:
        return (
          <span className={cn(baseClasses, 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300')}>
            <ClockIcon className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case AccountStatus.CREATING:
        return (
          <span className={cn(baseClasses, 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300')}>
            <ClockIcon className="mr-1 h-3 w-3 animate-spin" />
            Creating
          </span>
        );
      case AccountStatus.FAILED:
        return (
          <span className={cn(baseClasses, 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300')}>
            <XMarkIcon className="mr-1 h-3 w-3" />
            Failed
          </span>
        );
      case AccountStatus.SUSPENDED:
        return (
          <span className={cn(baseClasses, 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300')}>
            <ExclamationTriangleIcon className="mr-1 h-3 w-3" />
            Suspended
          </span>
        );
      default:
        return (
          <span className={cn(baseClasses, 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300')}>
            {status}
          </span>
        );
    }
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-muted rounded w-4"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/6"></div>
              <div className="h-4 bg-muted rounded w-1/8"></div>
              <div className="h-4 bg-muted rounded w-1/6"></div>
              <div className="h-4 bg-muted rounded w-1/8"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('email')}
              >
                Email
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Verified
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => handleSort('createdAt')}
              >
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Proxy
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {sortedAccounts.map((account) => (
              <tr
                key={account.id}
                className={cn(
                  'hover:bg-muted/50 transition-colors',
                  selectedAccounts.includes(account.id) && 'bg-muted/30'
                )}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleSelectAccount(account.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-foreground">
                      {account.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {account.firstName} {account.lastName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(account.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {account.isVerified ? (
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XMarkIcon className="h-5 w-5 text-red-600" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  <div title={formatDateTime(account.createdAt)}>
                    {formatRelativeTime(account.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {account.proxyId ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActions(showActions === account.id ? null : account.id)}
                    >
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </Button>
                    
                    {showActions === account.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent">
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Details
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent">
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-accent">
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-background px-6 py-3 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} results
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
