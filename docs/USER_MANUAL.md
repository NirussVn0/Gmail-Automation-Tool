# User Manual - Gmail Automation Tool Dashboard

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Account Management](#account-management)
4. [Account Creation](#account-creation)
5. [Analytics & Monitoring](#analytics--monitoring)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### First Login
1. Navigate to the dashboard URL provided by your administrator
2. Enter your credentials on the login page
3. If this is your first login, you may be prompted to change your password

### User Roles
- **Admin**: Full access to all features and settings
- **Operator**: Can create and manage accounts, view analytics
- **Viewer**: Read-only access to accounts and analytics

## Dashboard Overview

### Main Navigation
- **Dashboard**: Overview of system status and recent activity
- **Accounts**: Manage Gmail accounts
- **Create**: Start new account creation jobs
- **Analytics**: View performance metrics and reports
- **Config**: System configuration (Admin only)

### Status Indicators
- **Green**: System operating normally
- **Yellow**: Warning or attention needed
- **Red**: Error or system issue

## Account Management

### Viewing Accounts

#### Account List
The main accounts page displays all Gmail accounts in a table format:
- **Email**: The Gmail address
- **Name**: First and last name
- **Status**: Current account status
- **Verified**: SMS verification status
- **Created**: Account creation date

#### Filtering and Search
- Use the search bar to find specific accounts by email or name
- Filter by status: Active, Pending, Failed, Suspended
- Sort columns by clicking headers

#### Account Actions
For each account, you can:
- **View Details**: See complete account information
- **Edit**: Modify account details (if permitted)
- **Suspend**: Temporarily disable the account
- **Delete**: Permanently remove the account

### Bulk Operations
1. Select multiple accounts using checkboxes
2. Choose an action from the bulk actions menu:
   - Export selected accounts
   - Change status of multiple accounts
   - Delete multiple accounts

### Account Status Meanings
- **Active**: Account is working and verified
- **Pending**: Account created but awaiting verification
- **Failed**: Account creation failed
- **Suspended**: Account temporarily disabled
- **Deleted**: Account marked for deletion

## Account Creation

### Starting a Creation Job

#### Basic Configuration
1. Navigate to the "Create" page
2. Set the base name for accounts (e.g., "user" creates user1@gmail.com, user2@gmail.com)
3. Choose starting ID number
4. Set the number of accounts to create
5. Configure batch size (accounts created simultaneously)

#### Advanced Settings

**Timing Configuration**
- **Delay Range**: Random delay between account creations (in seconds)
- **Batch Size**: Number of accounts to process simultaneously

**Proxy Settings**
- **Use Proxy Rotation**: Enable/disable proxy usage
- **Automatic Rotation**: Rotate proxies automatically

**Verification Settings**
- **Enable SMS Verification**: Use SMS services for phone verification

**WebDriver Options**
- **Headless Mode**: Run browsers without GUI (recommended for performance)
- **User Agent Rotation**: Change browser fingerprint
- **Disable Images**: Speed up page loading
- **Window Size**: Browser window dimensions

### Monitoring Creation Progress

#### Progress Tracker
The progress tracker shows:
- **Overall Progress**: Percentage completed
- **Accounts Created**: Successfully created accounts
- **Failed Accounts**: Accounts that failed creation
- **Success Rate**: Percentage of successful creations
- **Estimated Completion**: Time remaining

#### Activity Log
Real-time log showing:
- Account creation attempts
- Success/failure messages
- Error details
- Timestamps

#### Job Controls
- **Pause**: Temporarily stop the creation process
- **Resume**: Continue a paused job
- **Stop**: Cancel the job completely

### Best Practices
- Start with small batches (5-10 accounts) to test settings
- Use realistic delays (2-8 seconds) to avoid detection
- Monitor success rates and adjust settings if needed
- Ensure proxy and SMS services are properly configured

## Analytics & Monitoring

### Overview Metrics
The analytics dashboard provides key metrics:
- **Total Accounts**: All-time account count
- **Success Rate**: Percentage of successful creations
- **Average Creation Time**: Time per account
- **Active Jobs**: Currently running creation jobs

### Performance Charts

#### Account Creation Trends
- **Daily View**: Accounts created per day over time
- **Hourly View**: Creation patterns throughout the day
- **Success Rate Trends**: Success rate changes over time

#### Performance Analysis
- **Proxy Performance**: Success rates by proxy server
- **SMS Service Performance**: Verification success by service
- **Creation Time Analysis**: Speed metrics

### Reports and Exports
- **Time Range Selection**: View data for specific periods
- **Export Reports**: Download analytics data as JSON
- **Scheduled Reports**: Set up automatic report generation

### Real-time Monitoring
- **Live Updates**: Dashboard updates automatically
- **Notifications**: Browser notifications for important events
- **System Status**: Real-time system health indicators

## Configuration

### Proxy Settings (Admin Only)

#### Adding Proxies
1. Navigate to Config → Proxy Settings
2. Click "Add Proxy"
3. Enter proxy details:
   - Host/IP address
   - Port number
   - Type (HTTP/SOCKS5)
   - Username/password (if required)

#### Proxy Management
- **Test Proxies**: Check proxy connectivity
- **Health Monitoring**: Automatic proxy health checks
- **Rotation Strategy**: Choose how proxies are selected

### SMS Verification Settings

#### Primary Service
1. Select SMS service provider
2. Enter API key
3. Test connection

#### Backup Service (Optional)
Configure a backup SMS service for redundancy

### WebDriver Configuration
- **Browser Settings**: Default browser options
- **Performance Tuning**: Memory and speed optimizations
- **Security Settings**: Anti-detection measures

### Security Settings (Admin Only)
- **JWT Configuration**: Token expiration and algorithms
- **Encryption Settings**: Data protection settings
- **Access Control**: User permissions and roles

## Troubleshooting

### Common Issues

#### Login Problems
**Issue**: Cannot log in
**Solutions**:
- Check username and password
- Clear browser cache and cookies
- Contact administrator for password reset

#### Account Creation Failures
**Issue**: High failure rate
**Solutions**:
- Check proxy connectivity
- Verify SMS service balance
- Reduce batch size
- Increase delays between creations

#### Slow Performance
**Issue**: Dashboard loading slowly
**Solutions**:
- Check internet connection
- Clear browser cache
- Reduce number of displayed items
- Contact administrator about server resources

### Error Messages

#### "Authentication Required"
- Your session has expired
- Log out and log back in

#### "Insufficient Permissions"
- You don't have access to this feature
- Contact administrator for role adjustment

#### "Network Error"
- Connection to server lost
- Check internet connection
- Try refreshing the page

#### "Proxy Connection Failed"
- Proxy server is not responding
- Check proxy configuration
- Try different proxy

### Getting Help

#### Built-in Help
- Hover over (?) icons for tooltips
- Check status indicators for system health
- Review activity logs for detailed information

#### Contacting Support
When contacting support, include:
- Your username and role
- Description of the issue
- Steps you've already tried
- Screenshots if applicable
- Browser and operating system information

### Maintenance Windows
- System maintenance is typically scheduled during off-peak hours
- You'll receive advance notification of planned maintenance
- During maintenance, some features may be temporarily unavailable

### Data Backup
- Account data is automatically backed up
- You can export your data at any time
- Contact administrator for data restoration requests

## Tips for Optimal Usage

### Performance Tips
- Use headless mode for better performance
- Enable image blocking to speed up creation
- Monitor system resources during large jobs
- Use appropriate batch sizes for your system

### Security Tips
- Log out when finished using the system
- Don't share your login credentials
- Report suspicious activity immediately
- Keep your browser updated

### Efficiency Tips
- Plan creation jobs during off-peak hours
- Test settings with small batches first
- Monitor success rates and adjust accordingly
- Use analytics to optimize your processes

## Keyboard Shortcuts

- **Ctrl+/** : Open help
- **Ctrl+K** : Quick search
- **Esc** : Close modals/dialogs
- **Tab** : Navigate between form fields
- **Enter** : Submit forms/confirm actions

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Recommended Settings
- Enable JavaScript
- Allow cookies
- Enable local storage
- Disable ad blockers for this site

For the best experience, use the latest version of Chrome or Firefox.
