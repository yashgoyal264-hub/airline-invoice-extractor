#!/bin/bash

echo "🔍 Network Diagnostic for TravelPlus Invoice Extractor"
echo "======================================================"
echo ""

# 1. Check current IP addresses
echo "📡 Your IP Addresses:"
echo "---------------------"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  • " $2}'
echo ""

# 2. Check if servers are running
echo "🖥️  Server Status:"
echo "-----------------"
if lsof -i :8888 > /dev/null 2>&1; then
    echo "  ✅ Frontend server: Running on port 8888"
else
    echo "  ❌ Frontend server: Not running"
fi

if lsof -i :5555 > /dev/null 2>&1; then
    echo "  ✅ Python backend: Running on port 5555"
else
    echo "  ⚠️  Python backend: Not running (optional)"
fi
echo ""

# 3. Check macOS Firewall
echo "🔥 Firewall Status:"
echo "-------------------"
if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
    echo "  ⚠️  macOS Firewall is ENABLED"
    echo "  You may need to allow incoming connections for Node.js"
    echo ""
    echo "  To fix:"
    echo "  1. Go to System Settings > Network > Firewall"
    echo "  2. Click 'Options'"
    echo "  3. Add Node.js to allowed apps or turn off 'Block all incoming connections'"
else
    echo "  ✅ macOS Firewall is disabled or allowing connections"
fi
echo ""

# 4. Get the correct network IP
echo "📱 Share These URLs:"
echo "--------------------"
# Get the most likely network IP (usually en0 for WiFi)
WIFI_IP=$(ifconfig en0 2>/dev/null | grep "inet " | awk '{print $2}')
ETHERNET_IP=$(ifconfig en1 2>/dev/null | grep "inet " | awk '{print $2}')

if [ -n "$WIFI_IP" ]; then
    echo "  WiFi Network:"
    echo "    http://$WIFI_IP:8888"
fi

if [ -n "$ETHERNET_IP" ]; then
    echo "  Ethernet Network:"
    echo "    http://$ETHERNET_IP:8888"
fi

# Also show all possible IPs
echo ""
echo "  All available URLs:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "    http://" $2 ":8888"}'
echo ""

# 5. Test local connectivity
echo "🧪 Connection Test:"
echo "-------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8888 | grep -q "200"; then
    echo "  ✅ Local connection works (localhost:8888)"
else
    echo "  ❌ Local connection failed"
fi
echo ""

# 6. Common Issues & Solutions
echo "🔧 Troubleshooting Guide:"
echo "-------------------------"
echo "  If others can't connect, try:"
echo ""
echo "  1. ✅ Make sure you're on the same WiFi network"
echo "     - Both devices should be on the same WiFi SSID"
echo ""
echo "  2. 🔥 Check Firewall Settings:"
echo "     - Go to System Settings > Network > Firewall"
echo "     - Turn OFF 'Block all incoming connections'"
echo "     - Or add Node.js to allowed apps"
echo ""
echo "  3. 🔄 Restart the server with explicit network binding:"
echo "     - Stop current server (Ctrl+C)"
echo "     - Edit server.js and ensure it listens on '0.0.0.0'"
echo ""
echo "  4. 📱 On the other device:"
echo "     - Make sure to use http:// (not https://)"
echo "     - Try different browsers if one doesn't work"
echo "     - Disable VPN if active"
echo ""
echo "  5. 🏠 Router/Network Issues:"
echo "     - Some corporate/hotel networks block local connections"
echo "     - Try creating a mobile hotspot as alternative"
echo ""

echo "======================================================"
echo "📝 Next Steps:"
echo "  1. Check if macOS Firewall is blocking (see above)"
echo "  2. Share the correct URL from 'Share These URLs' section"
echo "  3. If still not working, try the troubleshooting steps"
echo "======================================================="