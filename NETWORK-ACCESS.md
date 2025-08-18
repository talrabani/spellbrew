# Local Network Access Guide

This guide explains how to access your Spellbrew Hebrew learning game from other devices on the same WiFi network.

## 🚀 Quick Start

1. **Run the startup script:**
   ```bash
   start-local-network.bat
   ```

2. **Access from other devices:**
   ```
   http://192.168.1.121:5173
   ```

## 📋 Prerequisites

- Both devices must be connected to the same WiFi network
- Windows Firewall may need to allow connections on ports 5173 and 5000
- Your computer's IP address: `192.168.1.121`

## 🔧 Manual Setup

### Start Backend Server
```bash
cd server
npm run dev
```

### Start Frontend Server
```bash
cd client
npm run dev
```

## 🌐 Access URLs

### From Your Computer (Host)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### From Other Devices on Network
- Frontend: `http://192.168.1.121:5173`
- Backend: `http://192.168.1.121:5000`

## 🔒 Troubleshooting

### Windows Firewall Issues
If other devices can't connect, you may need to allow the ports through Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" and "Allow another app"
4. Add both Node.js and your development servers

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill processes on ports 5173 and 5000
netstat -ano | findstr :5173
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### IP Address Changed
If your IP address changes, update these files:
- `client/src/config.js` - Update the IP in the network configuration
- `start-local-network.bat` - Update the IP address

To find your current IP:
```bash
ipconfig | findstr "IPv4"
```

## 📱 Mobile Access

The app is responsive and works well on mobile devices. Simply open the URL in your mobile browser:
```
http://192.168.1.121:5173
```

## 🔄 Development Workflow

1. Make changes to your code
2. Both servers will auto-reload
3. Refresh the page on other devices to see changes
4. The app will automatically detect if it's being accessed from the network and use the correct API endpoints

## 🛡️ Security Note

This setup is for local development only. The servers are configured to accept connections from any device on your local network. Do not use this configuration for production deployment.
