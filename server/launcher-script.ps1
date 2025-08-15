# Neff Paving Server Hourly Launcher Script
# This PowerShell script provides life-support functionality for the server
# It checks if the server is running and restarts it if needed

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$RunOnce,
    [switch]$Status,
    [string]$LogLevel = "Info"
)

# Configuration
$ServerPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerScript = Join-Path $ServerPath "server.js"
$LogFile = Join-Path $ServerPath "logs\launcher.log"
$PidFile = Join-Path $ServerPath "server.pid"
$TaskName = "NeffPavingServerLauncher"
$ServerPort = 3001
$MaxRestartAttempts = 3
$RestartDelay = 30 # seconds

# Ensure logs directory exists
$LogsDir = Split-Path -Parent $LogFile
if (!(Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

# Logging function
function Write-LauncherLog {
    param([string]$Message, [string]$Level = "Info")
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Write to console
    switch ($Level) {
        "Error" { Write-Host $LogEntry -ForegroundColor Red }
        "Warning" { Write-Host $LogEntry -ForegroundColor Yellow }
        "Success" { Write-Host $LogEntry -ForegroundColor Green }
        default { Write-Host $LogEntry -ForegroundColor White }
    }
    
    # Write to log file
    try {
        Add-Content -Path $LogFile -Value $LogEntry -ErrorAction SilentlyContinue
    } catch {
        # If we can't write to log file, continue anyway
    }
}

# Check if server is running
function Test-ServerRunning {
    try {
        $Response = Invoke-RestMethod -Uri "http://localhost:$ServerPort/health" -Method GET -TimeoutSec 10
        return $Response.status -eq "OK"
    } catch {
        return $false
    }
}

# Get server process
function Get-ServerProcess {
    try {
        if (Test-Path $PidFile) {
            $Pid = Get-Content $PidFile -ErrorAction SilentlyContinue
            if ($Pid) {
                return Get-Process -Id $Pid -ErrorAction SilentlyContinue
            }
        }
        
        # Fallback: find by command line
        $Processes = Get-WmiObject Win32_Process | Where-Object { 
            $_.CommandLine -like "*node*server.js*" -and
            $_.CommandLine -like "*$ServerPath*"
        }
        
        if ($Processes) {
            return Get-Process -Id $Processes[0].ProcessId -ErrorAction SilentlyContinue
        }
    } catch {
        return $null
    }
    return $null
}

# Start server
function Start-Server {
    param([int]$Attempt = 1)
    
    Write-LauncherLog "Starting Neff Paving Server (attempt $Attempt of $MaxRestartAttempts)..."
    
    try {
        # Kill any existing processes first
        $ExistingProcess = Get-ServerProcess
        if ($ExistingProcess) {
            Write-LauncherLog "Terminating existing server process (PID: $($ExistingProcess.Id))..."
            $ExistingProcess | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep 5
        }
        
        # Start new server process
        $StartInfo = New-Object System.Diagnostics.ProcessStartInfo
        $StartInfo.FileName = "node"
        $StartInfo.Arguments = "`"$ServerScript`""
        $StartInfo.WorkingDirectory = $ServerPath
        $StartInfo.UseShellExecute = $false
        $StartInfo.CreateNoWindow = $true
        $StartInfo.RedirectStandardOutput = $false
        $StartInfo.RedirectStandardError = $false
        
        $Process = [System.Diagnostics.Process]::Start($StartInfo)
        
        if ($Process) {
            # Save PID
            $Process.Id | Out-File -FilePath $PidFile -Force
            Write-LauncherLog "Server started successfully (PID: $($Process.Id))" -Level "Success"
            
            # Wait and verify server is responding
            Start-Sleep 10
            
            $VerificationAttempts = 0
            while ($VerificationAttempts -lt 6) {
                if (Test-ServerRunning) {
                    Write-LauncherLog "Server is responding to health checks ✅" -Level "Success"
                    return $true
                }
                Start-Sleep 5
                $VerificationAttempts++
            }
            
            Write-LauncherLog "Server started but not responding to health checks" -Level "Warning"
            return $true
        } else {
            throw "Failed to start server process"
        }
        
    } catch {
        Write-LauncherLog "Failed to start server: $($_.Exception.Message)" -Level "Error"
        
        if ($Attempt -lt $MaxRestartAttempts) {
            Write-LauncherLog "Waiting $RestartDelay seconds before retry..."
            Start-Sleep $RestartDelay
            return Start-Server -Attempt ($Attempt + 1)
        } else {
            Write-LauncherLog "Max restart attempts reached. Server start failed." -Level "Error"
            return $false
        }
    }
}

# Stop server
function Stop-Server {
    Write-LauncherLog "Stopping Neff Paving Server..."
    
    $Process = Get-ServerProcess
    if ($Process) {
        try {
            $Process | Stop-Process -Force
            Write-LauncherLog "Server stopped (PID: $($Process.Id))" -Level "Success"
            
            # Clean up PID file
            if (Test-Path $PidFile) {
                Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
            }
            
            return $true
        } catch {
            Write-LauncherLog "Failed to stop server: $($_.Exception.Message)" -Level "Error"
            return $false
        }
    } else {
        Write-LauncherLog "Server process not found - may already be stopped" -Level "Warning"
        return $true
    }
}

# Main monitoring function
function Start-Monitoring {
    Write-LauncherLog "=== Neff Paving Server Life-Support Check ===" -Level "Success"
    Write-LauncherLog "Server Path: $ServerPath"
    Write-LauncherLog "Server Port: $ServerPort"
    Write-LauncherLog "Log File: $LogFile"
    
    # Check if server is running
    $ServerRunning = Test-ServerRunning
    $ProcessExists = $null -ne (Get-ServerProcess)
    
    Write-LauncherLog "Server Health Check: $(if($ServerRunning) {'✅ HEALTHY'} else {'❌ UNHEALTHY'})"
    Write-LauncherLog "Server Process: $(if($ProcessExists) {'✅ RUNNING'} else {'❌ NOT FOUND'})"
    
    if ($ServerRunning) {
        Write-LauncherLog "Server is running normally - no action needed" -Level "Success"
        return $true
    } elseif ($ProcessExists) {
        Write-LauncherLog "Server process exists but not responding - restarting..." -Level "Warning"
        Stop-Server | Out-Null
        Start-Sleep 5
        return Start-Server
    } else {
        Write-LauncherLog "Server is not running - starting..." -Level "Warning"
        return Start-Server
    }
}

# Install scheduled task
function Install-ScheduledTask {
    Write-LauncherLog "Installing Windows Scheduled Task for automatic server monitoring..."
    
    try {
        # Remove existing task if it exists
        $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($ExistingTask) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-LauncherLog "Removed existing scheduled task"
        }
        
        # Create new task
        $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`" -RunOnce"
        $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 9999)
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnDemand -DontStopIfGoingOnBatteries -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
        $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Neff Paving Server Life-Support - Monitors and restarts the server every hour"
        
        Write-LauncherLog "Scheduled task installed successfully ✅" -Level "Success"
        Write-LauncherLog "Task will run every hour to ensure server is running"
        return $true
        
    } catch {
        Write-LauncherLog "Failed to install scheduled task: $($_.Exception.Message)" -Level "Error"
        return $false
    }
}

# Uninstall scheduled task
function Uninstall-ScheduledTask {
    Write-LauncherLog "Uninstalling Windows Scheduled Task..."
    
    try {
        $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($ExistingTask) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-LauncherLog "Scheduled task uninstalled successfully ✅" -Level "Success"
        } else {
            Write-LauncherLog "No scheduled task found to uninstall" -Level "Warning"
        }
        return $true
        
    } catch {
        Write-LauncherLog "Failed to uninstall scheduled task: $($_.Exception.Message)" -Level "Error"
        return $false
    }
}

# Get status
function Get-LauncherStatus {
    Write-LauncherLog "=== Neff Paving Server Status ===" -Level "Success"
    
    # Check server
    $ServerRunning = Test-ServerRunning
    $Process = Get-ServerProcess
    
    Write-Host ""
    Write-Host "🏗️  NEFF PAVING SERVER STATUS" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host "Server Health: " -NoNewline
    if ($ServerRunning) {
        Write-Host "✅ HEALTHY" -ForegroundColor Green
    } else {
        Write-Host "❌ UNHEALTHY" -ForegroundColor Red
    }
    
    Write-Host "Server Process: " -NoNewline
    if ($Process) {
        Write-Host "✅ RUNNING (PID: $($Process.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ NOT FOUND" -ForegroundColor Red
    }
    
    # Check scheduled task
    $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Write-Host "Life-Support Task: " -NoNewline
    if ($Task) {
        Write-Host "✅ INSTALLED" -ForegroundColor Green
        Write-Host "Task State: $($Task.State)"
        if ($Task.Triggers) {
            Write-Host "Next Run: $(($Task.Triggers[0].StartBoundary))"
        }
    } else {
        Write-Host "❌ NOT INSTALLED" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Log File: $LogFile"
    Write-Host "Server Path: $ServerPath"
    Write-Host "Server Port: $ServerPort"
}

# Main execution logic
try {
    Write-LauncherLog "Neff Paving Server Launcher Script v1.0.0"
    
    if ($Install) {
        Install-ScheduledTask
        Write-LauncherLog "Installation complete. The server will be monitored every hour automatically."
        
    } elseif ($Uninstall) {
        Uninstall-ScheduledTask
        Write-LauncherLog "Uninstallation complete. Automatic monitoring has been disabled."
        
    } elseif ($Status) {
        Get-LauncherStatus
        
    } elseif ($RunOnce) {
        $Success = Start-Monitoring
        if ($Success) {
            Write-LauncherLog "Life-support check completed successfully ✅" -Level "Success"
        } else {
            Write-LauncherLog "Life-support check failed ❌" -Level "Error"
            exit 1
        }
        
    } else {
        # Default: show usage
        Write-Host ""
        Write-Host "🏗️  NEFF PAVING SERVER LAUNCHER" -ForegroundColor Yellow
        Write-Host "================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Usage:"
        Write-Host "  .\launcher-script.ps1 -Install     Install hourly monitoring"
        Write-Host "  .\launcher-script.ps1 -Uninstall   Remove hourly monitoring"
        Write-Host "  .\launcher-script.ps1 -RunOnce     Run life-support check once"
        Write-Host "  .\launcher-script.ps1 -Status      Show current status"
        Write-Host ""
        Write-Host "The life-support system ensures the server automatically"
        Write-Host "restarts if it crashes or becomes unresponsive."
        Write-Host ""
    }
    
} catch {
    Write-LauncherLog "Critical error in launcher script: $($_.Exception.Message)" -Level "Error"
    exit 1
}