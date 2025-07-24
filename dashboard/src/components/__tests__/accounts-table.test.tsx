import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountsTable } from '@/components/accounts/accounts-table';
import { GmailAccount, AccountStatus } from '@/types/domain';

const mockAccounts: GmailAccount[] = [
  {
    id: '1',
    email: 'test1@gmail.com',
    firstName: 'Test',
    lastName: 'User1',
    status: AccountStatus.ACTIVE,
    isVerified: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    email: 'test2@gmail.com',
    firstName: 'Test',
    lastName: 'User2',
    status: AccountStatus.PENDING,
    isVerified: false,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  },
];

const mockPagination = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
};

const defaultProps = {
  accounts: mockAccounts,
  selectedAccounts: [],
  onSelectionChange: jest.fn(),
  loading: false,
  pagination: mockPagination,
  onPageChange: jest.fn(),
};

describe('AccountsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders accounts correctly', () => {
    render(<AccountsTable {...defaultProps} />);
    
    expect(screen.getByText('test1@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('test2@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Test User1')).toBeInTheDocument();
    expect(screen.getByText('Test User2')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AccountsTable {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('handles select all functionality', () => {
    const onSelectionChange = jest.fn();
    render(<AccountsTable {...defaultProps} onSelectionChange={onSelectionChange} />);
    
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    fireEvent.click(selectAllCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('handles individual account selection', () => {
    const onSelectionChange = jest.fn();
    render(<AccountsTable {...defaultProps} onSelectionChange={onSelectionChange} />);
    
    const firstAccountCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(firstAccountCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('displays correct status badges', () => {
    render(<AccountsTable {...defaultProps} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows verification status correctly', () => {
    render(<AccountsTable {...defaultProps} />);
    
    const checkIcons = screen.getAllByTestId('check-icon');
    const xIcons = screen.getAllByTestId('x-icon');
    
    expect(checkIcons).toHaveLength(1);
    expect(xIcons).toHaveLength(1);
  });

  it('handles sorting', async () => {
    render(<AccountsTable {...defaultProps} />);
    
    const emailHeader = screen.getByText('Email');
    fireEvent.click(emailHeader);
    
    await waitFor(() => {
      expect(screen.getByText('test1@gmail.com')).toBeInTheDocument();
    });
  });

  it('shows pagination controls', () => {
    const pagination = {
      page: 2,
      limit: 20,
      total: 50,
      totalPages: 3,
    };
    
    render(<AccountsTable {...defaultProps} pagination={pagination} />);
    
    expect(screen.getByText('Showing 21 to 40 of 50 results')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles page navigation', () => {
    const onPageChange = jest.fn();
    const pagination = {
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    };
    
    render(<AccountsTable {...defaultProps} pagination={pagination} onPageChange={onPageChange} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(<AccountsTable {...defaultProps} />);
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    const pagination = {
      page: 3,
      limit: 20,
      total: 50,
      totalPages: 3,
    };
    
    render(<AccountsTable {...defaultProps} pagination={pagination} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('shows actions menu when clicked', async () => {
    render(<AccountsTable {...defaultProps} />);
    
    const actionButtons = screen.getAllByTestId('action-menu-button');
    fireEvent.click(actionButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});
