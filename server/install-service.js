const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'Neff Paving Estimate Server',
    description: 'Windows service for handling Neff Paving estimate form submissions with real-time alerts',
    script: path.join(__dirname, 'server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    env: {
        name: 'NODE_ENV',
        value: 'production'
    },
    wait: 2,
    grow: 0.5,
    maxRestarts: 10
});

// Listen for the "install" event, which indicates the process is available as a service
svc.on('install', function() {
    console.log('✅ Neff Paving Estimate Server service installed successfully!');
    console.log('🚀 Starting service...');
    svc.start();
});

// Listen for the "start" event and let us know when the service is started
svc.on('start', function() {
    console.log('✅ Neff Paving Estimate Server service started!');
    console.log('📊 Service Details:');
    console.log(`   • Name: ${svc.name}`);
    console.log(`   • Description: ${svc.description}`);
    console.log(`   • Script: ${svc.script}`);
    console.log(`   • Port: 3001`);
    console.log('🔄 Service will automatically restart on system reboot');
    console.log('📋 To uninstall: npm run uninstall-service');
});

// Listen for errors
svc.on('error', function(error) {
    console.error('❌ Service error:', error);
});

// Install the service
console.log('🔧 Installing Neff Paving Estimate Server as Windows Service...');
console.log('⚠️  Administrator privileges may be required');
svc.install();