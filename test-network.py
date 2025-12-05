#!/usr/bin/env python3
"""
Simple test server to verify network connectivity
"""
import http.server
import socketserver
import socket

def get_ip():
    """Get local IP address"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

PORT = 9999

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = f"""
            <html>
            <head>
                <title>Network Test</title>
                <style>
                    body {{ font-family: Arial; padding: 40px; background: #f0f0f0; }}
                    .success {{ color: green; font-size: 24px; }}
                    .info {{ background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <h1 class="success">✅ Network Connection Successful!</h1>
                <div class="info">
                    <h2>If you can see this page:</h2>
                    <ul>
                        <li>Network sharing is working correctly</li>
                        <li>The main app should also be accessible</li>
                        <li>Try accessing: <a href="http://{get_ip()}:8888">http://{get_ip()}:8888</a></li>
                    </ul>
                    <p><strong>Your IP:</strong> {self.client_address[0]}</p>
                    <p><strong>Server IP:</strong> {get_ip()}</p>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
        else:
            super().do_GET()

with socketserver.TCPServer(("0.0.0.0", PORT), MyHandler) as httpd:
    ip = get_ip()
    print(f"""
    ========================================
    🧪 NETWORK TEST SERVER
    ========================================
    
    Test server running on port {PORT}
    
    Share this URL with others on your network:
    http://{ip}:{PORT}
    
    If they CAN access this test page:
    ✅ Network sharing works - the issue is with Node.js
    
    If they CANNOT access this test page:
    ❌ Network/Router is blocking local connections
    
    Press Ctrl+C to stop
    ========================================
    """)
    httpd.serve_forever()