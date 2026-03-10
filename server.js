const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Load ML handler logic from api/predict.js
const predictHandler = require('./api/predict.js');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Simulate Vercel Rewrites
    if (pathname === '/' || pathname === '/index.html') {
        pathname = '/frontend/index.html';
    } else if (pathname === '/script.js') {
        pathname = '/frontend/script.js';
    } else if (pathname === '/style.css') {
        pathname = '/frontend/style.css';
    } else if (pathname === '/stats.json') {
        pathname = '/frontend/stats.json';
    }

    // Handle API
    if (pathname === '/api/predict' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            // Mock Vercel req/res for the predict handler
            const vReq = { body: JSON.parse(body), method: 'POST' };
            const vRes = {
                status: (code) => ({
                    json: (data) => {
                        res.writeHead(code, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(data));
                    }
                }),
                json: (data) => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                }
            };

            try {
                predictHandler(vReq, vRes);
            } catch (err) {
                console.error(err);
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
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 Dashboard Live on Localhost! 
--------------------------------
🔗 URL: http://localhost:${PORT}
--------------------------------
API Status: ACTIVE
ML Engine: READY
  `);
});
