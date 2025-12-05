const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 8888;

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    console.log(`Serving index.html to ${req.ip}`);
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get network interfaces
function getNetworkIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    const ips = getNetworkIPs();
    
    console.log('\n========================================');
    console.log('🚀 TravelPlus Invoice Extractor Server');
    console.log('========================================\n');
    
    console.log('Server is running!\n');
    console.log('Access the application at:\n');
    
    // Local access
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`            http://127.0.0.1:${PORT}`);
    
    // Network access
    if (ips.length > 0) {
        console.log('\n  Network:');
        ips.forEach(ip => {
            console.log(`            http://${ip}:${PORT}`);
        });
    }
    
    console.log('\n========================================');
    console.log('Share any of the Network URLs above with');
    console.log('others on the same network to access the app');
    console.log('========================================\n');
    console.log('Press Ctrl+C to stop the server\n');
});

// Handle server errors
app.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close other applications using this port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});