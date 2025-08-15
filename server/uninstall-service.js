const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'Neff Paving Estimate Server',
    description: 'Windows service for handling Neff Paving estimate form submissions with real-time alerts',
    script: path.join(__dirname, 'server.js')
});

// Listen for the "uninstall" event so we know when it's done
svc.on('uninstall', function() {
    console.log('✅ Neff Paving Estimate Server service uninstalled successfully!');
    console.log('🔄 Service has been removed from Windows Services');
    process.exit(0);
});

// Listen for errors
svc.on('error', function(error) {
    console.error('❌ Service error:', error);
});

// Uninstall the service
console.log('🗑️  Uninstalling Neff Paving Estimate Server Windows Service...');
console.log('⚠️  Administrator privileges may be required');
svc.uninstall();