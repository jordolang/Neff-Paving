# 🏗️ Neff Paving Windows Server

A comprehensive Windows server solution for handling Neff Paving estimate form submissions with real-time alerts, automatic CSV storage, and screenshot capture.

## 🚀 Features

### Core Functionality
- **Real-time Form Processing**: Handles estimate submissions from the website
- **CSV Data Storage**: Automatically saves all submissions with timestamps
- **Screenshot Capture**: Takes map screenshots with Puppeteer showing selected areas
- **Loud Alert System**: 75% volume alerts with persistent popup notifications
- **Windows Service**: Runs automatically on system startup
- **Life-Support System**: Hourly monitoring and automatic restart capability

### Alert System
- **Sound Notifications**: Windows system sounds at maximum volume
- **Popup Alerts**: Persistent popup windows with customer details
- **System Tray Integration**: Electron GUI with system tray icon
- **Print Functionality**: Quick print options for customer information
- **Contact Export**: Copy customer info to clipboard for Google Contacts

### Data Management
- **CSV Export**: All submissions saved to `estimate-form-data-requests.csv`
- **Screenshot Archive**: Map images saved to `screenshots/` folder
- **Logging System**: Comprehensive logs in `logs/` directory
- **Data Integrity**: Automatic backup and recovery mechanisms

## 📋 Requirements

- **Windows 10/11**: Required for Windows Service and system tray functionality
- **Node.js 16+**: Runtime environment for the server
- **Administrative Privileges**: Required for Windows Service installation
- **Internet Connection**: For Google Maps API and Puppeteer

## 🔧 Installation

### Automatic Installation (Recommended)

1. **Run as Administrator**: Right-click `install-and-start.bat` and select "Run as Administrator"
2. **Follow Prompts**: The installer will handle everything automatically
3. **Verify Installation**: The server will start and show confirmation

### Manual Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Install Windows Service**:
   ```bash
   npm run install-service
   ```

3. **Install Life-Support System**:
   ```powershell
   .\launcher-script.ps1 -Install
   ```

4. **Start GUI (Optional)**:
   ```bash
   npm run start-gui
   ```

## 🎮 Usage

### Starting the Server

**Option 1: Windows Service (Automatic)**
- Installed as "Neff Paving Estimate Server"
- Starts automatically on system boot
- Manages itself with restart capability

**Option 2: Manual Start**
- Double-click `start-server.bat`
- Or run: `npm start`

**Option 3: GUI Control Panel**
- Run: `npm run start-gui`
- System tray icon for easy management

### Managing the Server

#### Control Panel GUI
- **System Tray**: Right-click icon for quick actions
- **Status Monitoring**: Real-time server health checks
- **Alert Testing**: Test notification system
- **File Access**: Quick access to CSV and screenshots

#### Command Line Scripts
```bash
# Start server manually
npm start

# Start GUI control panel  
npm run start-gui

# Install Windows service
npm run install-service

# Uninstall Windows service
npm run uninstall-service

# Life-support management
.\launcher-script.ps1 -Install    # Enable hourly monitoring
.\launcher-script.ps1 -Status     # Check system status
.\launcher-script.ps1 -RunOnce    # Run health check once
.\launcher-script.ps1 -Uninstall  # Disable monitoring
```

## 📊 Server Endpoints

- **POST /submit-estimate**: Receives form submissions from website
- **GET /health**: Health check endpoint for monitoring
- **GET /stats**: Server statistics and submission counts

## 📁 File Structure

```
server/
├── server.js                    # Main server application
├── package.json                 # Dependencies and scripts
├── install-service.js           # Windows service installer
├── uninstall-service.js         # Windows service removal
├── launcher-script.ps1          # Life-support PowerShell script
├── start-server.bat             # Manual server startup
├── install-and-start.bat        # Automatic installation
├── gui/                         # Electron GUI application
│   ├── main.js                  # Main Electron process
│   └── index.html               # Control panel interface
├── screenshots/                 # Map screenshot storage
├── logs/                        # Server and launcher logs
└── README.md                    # This file
```

## 🔔 Alert System Details

### When Alerts Trigger
- New estimate form submission received
- Server startup/restart events
- System health check failures

### Alert Components
1. **Sound**: Windows system notification sound at 75% volume
2. **Popup**: Persistent window with customer details and action buttons
3. **System Tray**: Balloon notification for Windows system tray
4. **Log Entry**: Detailed logging with timestamps

### Alert Actions
- **Close**: Dismiss the alert
- **Print**: Print customer information 
- **Copy Contact**: Copy details to clipboard for Google Contacts
- **Save**: Manual save options

## 🛡️ Life-Support System

The life-support system ensures maximum uptime and reliability:

### Monitoring Features
- **Health Checks**: HTTP requests to server every hour
- **Process Monitoring**: Validates server process is running
- **Automatic Restart**: Restarts failed/unresponsive server
- **Retry Logic**: Multiple restart attempts with delays
- **Error Recovery**: Handles various failure scenarios

### Installation
```powershell
# Enable automatic monitoring
.\launcher-script.ps1 -Install

# Check system status
.\launcher-script.ps1 -Status
```

### Scheduled Task
Creates Windows Scheduled Task "NeffPavingServerLauncher":
- **Frequency**: Every hour on the hour
- **User**: SYSTEM account for reliability
- **Action**: Check server health and restart if needed

## 📈 Data Storage

### CSV File Format
`estimate-form-data-requests.csv` contains:
- Submission timestamp and date
- Customer contact information
- Project details (type, material, area)
- Pricing breakdown (material, labor, equipment, total)
- Polygon coordinates for map area
- Screenshot filename reference

### Screenshot Files
`screenshots/` folder structure:
- **Naming**: `{customer-name}-{timestamp}-map-data.png`
- **Content**: Satellite map with highlighted project area
- **Marker**: Neff Paving branded marker at area center
- **Resolution**: 1200x800 pixels for clarity

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to "production" for Windows Service
- `PORT`: Server port (default: 3001)

### Server Settings
Edit `server.js` to modify:
- **Port**: Change `PORT` variable
- **CSV Headers**: Modify `csvWriter` configuration  
- **Screenshot Settings**: Adjust Puppeteer viewport and options
- **Alert Volume**: Modify PowerShell sound commands
- **Retry Logic**: Change `MaxRestartAttempts` in launcher script

## 🚨 Troubleshooting

### Server Won't Start
1. **Check Node.js**: Ensure Node.js 16+ is installed
2. **Check Port**: Verify port 3001 is available
3. **Check Permissions**: Run as Administrator for service installation
4. **Check Dependencies**: Run `npm install` to reinstall packages

### Alerts Not Working
1. **Test Audio**: Run alert test from GUI control panel
2. **Check Volume**: Ensure Windows volume is not muted
3. **Check Notifications**: Enable Windows notifications
4. **Check PowerShell**: Verify PowerShell execution policy

### CSV/Screenshots Not Saving
1. **Check Permissions**: Ensure write access to server directory
2. **Check Disk Space**: Verify sufficient storage available
3. **Check Paths**: Validate file paths in server logs

### Service Installation Fails
1. **Run as Administrator**: Required for Windows Service operations
2. **Check node-windows**: Ensure dependency is properly installed
3. **Check Windows Version**: Requires Windows 10/11
4. **Disable Antivirus**: Temporarily disable during installation

### Life-Support Not Working
1. **Check Scheduled Tasks**: Verify task exists in Windows Task Scheduler
2. **Check PowerShell Policy**: May need to adjust execution policy
3. **Check Logs**: Review `logs/launcher.log` for errors
4. **Manual Test**: Run `.\launcher-script.ps1 -RunOnce`

## 📞 Support

For technical support or issues:
- **Check Logs**: Review files in `logs/` directory
- **Run Diagnostics**: Use `.\launcher-script.ps1 -Status`
- **Test Components**: Use GUI control panel test functions
- **Server Health**: Check `http://localhost:3001/health`

## 📝 Version History

### v1.0.0 - Initial Release
- Complete Windows server implementation
- Real-time form processing and alerts
- CSV storage and screenshot capture
- Windows Service integration
- Life-support monitoring system
- Electron GUI control panel

---

🏗️ **Neff Paving Server v1.0.0** - Built for Windows with Node.js, Express, Puppeteer, and Electron