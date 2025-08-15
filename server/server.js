const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const puppeteer = require('puppeteer');
const notifier = require('node-notifier');
const { spawn, exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure directories exist
const ensureDirectories = async () => {
    const dirs = [
        path.join(__dirname, 'screenshots'),
        path.join(__dirname, 'logs'),
        path.join(__dirname, 'sounds')
    ];
    
    for (const dir of dirs) {
        await fs.ensureDir(dir);
    }
};

// CSV file path
const csvFilePath = path.join(__dirname, 'estimate-form-data-requests.csv');

// CSV writer configuration
const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
        { id: 'submissionTime', title: 'Submission Time' },
        { id: 'submissionDate', title: 'Submission Date' },
        { id: 'customerName', title: 'Customer Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'address', title: 'Property Address' },
        { id: 'projectType', title: 'Project Type' },
        { id: 'material', title: 'Material Type' },
        { id: 'selectedArea', title: 'Area (sq ft)' },
        { id: 'estimatedPrice', title: 'Estimated Price' },
        { id: 'materialCost', title: 'Material Cost' },
        { id: 'laborCost', title: 'Labor Cost' },
        { id: 'equipmentCost', title: 'Equipment Cost' },
        { id: 'totalCost', title: 'Total Cost' },
        { id: 'notes', title: 'Additional Notes' },
        { id: 'polygonCoordinates', title: 'Polygon Coordinates' },
        { id: 'screenshotPath', title: 'Screenshot Path' },
        { id: 'mapCenter', title: 'Map Center' },
        { id: 'mapZoom', title: 'Map Zoom' }
    ],
    append: true
});

// Initialize CSV file with headers if it doesn't exist
const initializeCsvFile = async () => {
    try {
        if (!await fs.pathExists(csvFilePath)) {
            // Write empty record to create headers
            await csvWriter.writeRecords([]);
            console.log('✅ CSV file initialized with headers');
        }
    } catch (error) {
        console.error('❌ Error initializing CSV file:', error);
    }
};

// Play alert sound
const playAlertSound = () => {
    try {
        // Use Windows built-in sound for maximum compatibility
        if (process.platform === 'win32') {
            exec('powershell -c "(New-Object Media.SoundPlayer \\"C:\\Windows\\Media\\notify.wav\\").PlaySync();"', (error) => {
                if (error) {
                    // Fallback to system beep
                    exec('echo ^G', { shell: 'cmd' });
                }
            });
        }
    } catch (error) {
        console.error('❌ Error playing sound:', error);
    }
};

// Show Windows notification with popup
const showNotification = (data) => {
    const submissionTime = moment().format('hh:mm:ss A');
    const submissionDate = moment().format('MM/DD/YYYY');
    
    const title = '🚨 ALERT! New Estimate Form Submission Live!';
    const message = `Time: ${submissionTime}, Date: ${submissionDate}\\n\\n` +
                   `👤 Customer: ${data.customerName}\\n` +
                   `📧 Email: ${data.email}\\n` +
                   `📞 Phone: ${data.phone}\\n` +
                   `📍 Address: ${data.address}\\n` +
                   `🏗️ Project: ${data.projectType}\\n` +
                   `📏 Area: ${data.selectedArea} sq ft\\n` +
                   `💰 Estimate: ${data.estimatedPrice}\\n\\n` +
                   `✅ Data automatically saved to CSV file\\n` +
                   `⚠️ REQUIRED: Contact customer for follow-up`;

    // Show native Windows notification
    notifier.notify({
        title: title,
        message: message,
        icon: path.join(__dirname, 'icon.ico'),
        sound: false, // We'll play our own sound
        wait: true,
        timeout: 0 // Persistent notification
    });

    // Also show a more prominent alert using PowerShell
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.Text = "🚨 NEFF PAVING ALERT!"
$form.Size = New-Object System.Drawing.Size(600,500)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::Red
$form.ForeColor = [System.Drawing.Color]::White

$label = New-Object System.Windows.Forms.Label
$label.Location = New-Object System.Drawing.Point(20,20)
$label.Size = New-Object System.Drawing.Size(550,350)
$label.Font = New-Object System.Drawing.Font("Arial",12,[System.Drawing.FontStyle]::Bold)
$label.Text = @"
🚨 ALERT! New Estimate Form Submission Live!

⏰ Time: ${submissionTime}
📅 Date: ${submissionDate}

👤 Customer: ${data.customerName}
📧 Email: ${data.email}
📞 Phone: ${data.phone}
📍 Address: ${data.address}
🏗️ Project Type: ${data.projectType}
📏 Area: ${data.selectedArea} sq ft
💰 Estimated Price: ${data.estimatedPrice}

✅ Data automatically saved to CSV file
⚠️ REQUIRED: Contact customer for follow-up
📋 Austin and Clint will also be alerted
"@

$closeBtn = New-Object System.Windows.Forms.Button
$closeBtn.Location = New-Object System.Drawing.Point(50,400)
$closeBtn.Size = New-Object System.Drawing.Size(100,30)
$closeBtn.Text = "Close"
$closeBtn.Add_Click({$form.Close()})

$printBtn = New-Object System.Windows.Forms.Button
$printBtn.Location = New-Object System.Drawing.Point(200,400)
$printBtn.Size = New-Object System.Drawing.Size(100,30)
$printBtn.Text = "Print"
$printBtn.Add_Click({
    $printDialog = New-Object System.Windows.Forms.PrintDialog
    if($printDialog.ShowDialog() -eq "OK") {
        # Simple print functionality
        $label.Text | Out-Printer
    }
})

$contactBtn = New-Object System.Windows.Forms.Button
$contactBtn.Location = New-Object System.Drawing.Point(350,400)
$contactBtn.Size = New-Object System.Drawing.Size(150,30)
$contactBtn.Text = "Save to Google Contacts"
$contactBtn.Add_Click({
    [System.Windows.Forms.MessageBox]::Show("Contact info copied to clipboard! Paste into Google Contacts.", "Contact Info")
    Set-Clipboard -Value "${data.customerName}\\n${data.email}\\n${data.phone}\\n${data.address}"
})

$form.Controls.Add($label)
$form.Controls.Add($closeBtn)
$form.Controls.Add($printBtn)
$form.Controls.Add($contactBtn)
$form.ShowDialog()
`;

    // Write PowerShell script to temp file and execute
    const tempScript = path.join(__dirname, 'temp_alert.ps1');
    fs.writeFileSync(tempScript, psScript);
    
    exec(`powershell -ExecutionPolicy Bypass -File "${tempScript}"`, (error) => {
        // Clean up temp file
        fs.remove(tempScript);
        if (error) {
            console.error('❌ Error showing PowerShell alert:', error);
        }
    });
};

// Take screenshot of the map with polygon
const takeMapScreenshot = async (mapData) => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // Create HTML content with the map and polygon
        const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA7VWDFVhPwWzWrkLxQQ1bktzQvikLoDXk&libraries=geometry"></script>
    <style>
        #map { height: 800px; width: 1200px; }
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        function initMap() {
            const mapCenter = ${JSON.stringify(mapData.mapCenter || { lat: 39.94041, lng: -82.00734 })};
            const coordinates = ${JSON.stringify(mapData.polygonCoordinates || [])};
            
            const map = new google.maps.Map(document.getElementById('map'), {
                zoom: ${mapData.mapZoom || 18},
                center: mapCenter,
                mapTypeId: 'satellite'
            });

            if (coordinates.length > 0) {
                const polygon = new google.maps.Polygon({
                    paths: coordinates,
                    strokeColor: '#FFD700',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    fillColor: '#FFD700',
                    fillOpacity: 0.4
                });
                polygon.setMap(map);

                // Add marker at the center of polygon
                const bounds = new google.maps.LatLngBounds();
                coordinates.forEach(coord => bounds.extend(coord));
                const center = bounds.getCenter();
                
                new google.maps.Marker({
                    position: center,
                    map: map,
                    title: 'Project Area: ${mapData.selectedArea} sq ft',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
                            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="15" fill="#FFD700" stroke="#000" stroke-width="2"/>
                                <text x="20" y="25" text-anchor="middle" fill="#000" font-size="12" font-weight="bold">NP</text>
                            </svg>\`)
                    }
                });
            }
        }
        
        // Wait for map to load then take screenshot
        setTimeout(() => {
            window.mapReady = true;
        }, 3000);
        
        initMap();
    </script>
</body>
</html>`;

        await page.setContent(mapHtml);
        await page.waitForFunction(() => window.mapReady, { timeout: 10000 });
        
        // Generate filename
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const customerName = mapData.customerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const filename = `${customerName}-${timestamp}-map-data.png`;
        const screenshotPath = path.join(__dirname, 'screenshots', filename);
        
        await page.screenshot({ 
            path: screenshotPath,
            fullPage: true,
            type: 'png'
        });
        
        await browser.close();
        
        console.log(`✅ Screenshot saved: ${filename}`);
        return filename;
        
    } catch (error) {
        console.error('❌ Error taking screenshot:', error);
        return null;
    }
};

// Main form submission handler
app.post('/submit-estimate', async (req, res) => {
    try {
        console.log('📝 New estimate form submission received');
        
        const submissionTime = moment().format('hh:mm:ss A');
        const submissionDate = moment().format('MM/DD/YYYY');
        
        const formData = req.body;
        
        // Parse price information
        const estimatedPriceStr = formData.estimatedPrice || '$0.00';
        const estimatedPriceNum = parseFloat(estimatedPriceStr.replace(/[$,]/g, ''));
        
        // Calculate breakdown if not provided
        const area = parseFloat(formData.selectedArea) || 0;
        const materialPrices = { asphalt: 8, concrete: 12, brick: 15, stone: 20 };
        const materialPrice = materialPrices[formData.material] || 8;
        
        const materialCost = area * materialPrice;
        const laborCost = area * 3;
        const equipmentCost = Math.max(200, area * 0.5);
        const totalCost = materialCost + laborCost + equipmentCost;
        
        // Take screenshot
        const screenshotFilename = await takeMapScreenshot({
            customerName: formData.customerName,
            polygonCoordinates: formData.polygonCoordinates,
            selectedArea: formData.selectedArea,
            mapCenter: formData.mapCenter,
            mapZoom: formData.mapZoom
        });
        
        // Prepare CSV record
        const csvRecord = {
            submissionTime,
            submissionDate,
            customerName: formData.customerName || '',
            email: formData.email || '',
            phone: formData.phone || '',
            address: formData.address || '',
            projectType: formData.projectType || '',
            material: formData.material || '',
            selectedArea: formData.selectedArea || '0',
            estimatedPrice: estimatedPriceStr,
            materialCost: `$${materialCost.toFixed(2)}`,
            laborCost: `$${laborCost.toFixed(2)}`,
            equipmentCost: `$${equipmentCost.toFixed(2)}`,
            totalCost: `$${totalCost.toFixed(2)}`,
            notes: formData.notes || '',
            polygonCoordinates: JSON.stringify(formData.polygonCoordinates || []),
            screenshotPath: screenshotFilename || '',
            mapCenter: JSON.stringify(formData.mapCenter || {}),
            mapZoom: formData.mapZoom || '18'
        };
        
        // Write to CSV
        await csvWriter.writeRecords([csvRecord]);
        
        // Log the submission
        const logEntry = `${moment().format('YYYY-MM-DD HH:mm:ss')} - New submission from ${formData.customerName} (${formData.email})\\n`;
        await fs.appendFile(path.join(__dirname, 'logs', 'submissions.log'), logEntry);
        
        // Play alert sound
        playAlertSound();
        
        // Show notification (with delay to ensure sound plays first)
        setTimeout(() => {
            showNotification(formData);
        }, 500);
        
        console.log(`✅ Form submission processed successfully for ${formData.customerName}`);
        
        res.json({
            success: true,
            message: 'Estimate request received successfully',
            referenceNumber: `NP-${moment().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            submissionTime,
            submissionDate,
            screenshotSaved: !!screenshotFilename
        });
        
    } catch (error) {
        console.error('❌ Error processing form submission:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing estimate request',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: moment().format(),
        uptime: process.uptime(),
        server: 'Neff Paving Estimate Server'
    });
});

// Get submissions count
app.get('/stats', async (req, res) => {
    try {
        const csvExists = await fs.pathExists(csvFilePath);
        let submissionCount = 0;
        
        if (csvExists) {
            const csvContent = await fs.readFile(csvFilePath, 'utf8');
            const lines = csvContent.split('\\n').filter(line => line.trim());
            submissionCount = Math.max(0, lines.length - 1); // Subtract header
        }
        
        res.json({
            totalSubmissions: submissionCount,
            serverStartTime: serverStartTime,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\\n🔄 Received shutdown signal, closing server...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const serverStartTime = moment().format();

const startServer = async () => {
    try {
        await ensureDirectories();
        await initializeCsvFile();
        
        const server = app.listen(PORT, HOST, () => {
            console.log('\\n🚀 =================================');
            console.log('🏗️  NEFF PAVING ESTIMATE SERVER');
            console.log('🚀 =================================');
            console.log(`✅ Server running on http://${HOST}:${PORT}`);
            console.log(`📅 Started: ${serverStartTime}`);
            console.log(`📁 CSV File: ${csvFilePath}`);
            console.log(`📸 Screenshots: ${path.join(__dirname, 'screenshots')}`);
            console.log(`📊 Health Check: http://${HOST}:${PORT}/health`);
            console.log(`📈 Stats: http://${HOST}:${PORT}/stats`);
            console.log('🚀 =================================\\n');
            
            // Play startup sound
            setTimeout(playAlertSound, 1000);
        });
        
        // Make server globally available for graceful shutdown
        global.server = server;
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;