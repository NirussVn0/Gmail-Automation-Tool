'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AccountStatus } from '@/types/domain';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AccountsFiltersProps {
  filters: {
    status?: AccountStatus;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
  onFiltersChange: (filters: AccountsFiltersProps['filters']) => void;
}

export function AccountsFilters({ filters, onFiltersChange }: AccountsFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: AccountStatus.ACTIVE, label: 'Active' },
    { value: AccountStatus.PENDING, label: 'Pending' },
    { value: AccountStatus.CREATING, label: 'Creating' },
    { value: AccountStatus.FAILED, label: 'Failed' },
    { value: AccountStatus.SUSPENDED, label: 'Suspended' },
    { value: AccountStatus.DELETED, label: 'Deleted' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email..."
              value={localFilters.search || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => setLocalFilters({ 
              ...localFilters, 
              status: e.target.value as AccountStatus || undefined 
            })}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date From
          </label>
          <input
            type="date"
            value={localFilters.dateFrom?.toISOString().split('T')[0] || ''}
            onChange={(e) => setLocalFilters({ 
              ...localFilters, 
              dateFrom: e.target.value ? new Date(e.target.value) : undefined 
            })}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date To
          </label>
          <input
            type="date"
            value={localFilters.dateTo?.toISOString().split('T')[0] || ''}
            onChange={(e) => setLocalFilters({ 
              ...localFilters, 
              dateTo: e.target.value ? new Date(e.target.value) : undefined 
            })}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {Object.keys(filters).length > 0 && (
            <span>
              {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''} applied
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleClearFilters}>
            <XMarkIcon className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
