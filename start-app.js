const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Neff Paving application...');

// Start the development server
const child = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`Application exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down application...');
  child.kill('SIGINT');
});
