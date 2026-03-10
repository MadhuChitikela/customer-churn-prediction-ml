const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Load ML handler logic from api/predict.js
let predictHandler;
try {
    predictHandler = require('./api/predict.js');
} catch (e) {
    console.error("Critical: Could not load predict handler!", e.message);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Simulate Vercel Rewrites
    const rewrites = {
        '/': '/frontend/index.html',
        '/index.html': '/frontend/index.html',
        '/script.js': '/frontend/script.js',
        '/style.css': '/frontend/style.css',
        '/stats.json': '/frontend/stats.json'
    };

    if (rewrites[pathname]) {
        pathname = rewrites[pathname];
    }

    // Handle API
    if (pathname === '/api/predict' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const vReq = { body: payload, method: 'POST' };
                const vRes = {
                    status: (code) => ({
                        json: (data) => {
                            res.writeHead(code, {
                                'Content-Type': 'application/json',
                                'Cache-Control': 'no-cache'
                            });
                            res.end(JSON.stringify(data));
                        }
                    }),
                    json: (data) => {
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                        });
                        res.end(JSON.stringify(data));
                    }
                };

                if (predictHandler) {
                    predictHandler(vReq, vRes);
                } else {
                    res.writeHead(503);
                    res.end(JSON.stringify({ error: "ML Engine not loaded" }));
                }
            } catch (err) {
                console.error("API Processing Error:", err);
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Serve static files
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath).toLowerCase();

    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found: ' + pathname);
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 ChurnAI Dashboard | Multi-Source ML
--------------------------------------
🔗 View Locally: http://localhost:${PORT}
📁 Dashboard Path: ${path.join(__dirname, 'frontend')}
--------------------------------------
(Press Ctrl+C to stop)
  `);
});
