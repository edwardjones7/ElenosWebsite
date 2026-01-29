const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const WAITLIST_CSV = path.join(__dirname, 'waitlist.csv');
const CONTACT_CSV = path.join(__dirname, 'contact.csv');

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// Ensure CSV files exist with headers if they don't exist
if (!fs.existsSync(WAITLIST_CSV)) {
    fs.writeFileSync(WAITLIST_CSV, 'Email,Date\n');
}

if (!fs.existsSync(CONTACT_CSV)) {
    fs.writeFileSync(CONTACT_CSV, 'Name,Email,Company,Service,Timeline,Budget,Details,Date\n');
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && (req.url === '/api/waitlist' || req.url.startsWith('/api/waitlist'))) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const email = data.email;

                if (!email || !email.includes('@')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid email' }));
                    return;
                }

                // Append email and timestamp to CSV
                const timestamp = new Date().toISOString();
                const csvLine = `"${email}","${timestamp}"\n`;
                
                fs.appendFileSync(WAITLIST_CSV, csvLine);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Email saved successfully' }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Server error' }));
            }
        });
    } else if (req.method === 'POST' && (req.url === '/api/contact' || req.url.startsWith('/api/contact'))) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { name, email, company, service, timeline, budget, details } = data;

                if (!email || !email.includes('@')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Invalid email' }));
                    return;
                }

                if (!name || !details) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Name and project details are required' }));
                    return;
                }

                // Escape quotes and commas in CSV values
                const escapeCSV = (value) => {
                    if (!value) return '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                };

                // Append contact form data to CSV
                const timestamp = new Date().toISOString();
                const csvLine = [
                    escapeCSV(name),
                    escapeCSV(email),
                    escapeCSV(company),
                    escapeCSV(service),
                    escapeCSV(timeline),
                    escapeCSV(budget),
                    escapeCSV(details),
                    escapeCSV(timestamp)
                ].join(',') + '\n';
                
                fs.appendFileSync(CONTACT_CSV, csvLine);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Contact form submitted successfully' }));
            } catch (error) {
                console.error('Error processing contact form:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Server error' }));
            }
        });
    } else if (req.method === 'GET') {
        let reqPath = url.parse(req.url, true).pathname;
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.join(__dirname, reqPath.replace(/^\//, ''));

        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(path.resolve(__dirname))) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not found');
                } else {
                    res.writeHead(500);
                    res.end('Server error');
                }
                return;
            }
            const ext = path.extname(filePath);
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.end(data);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Every waitlist signup is saved to: ${WAITLIST_CSV}`);
    console.log(`Every contact form submission is saved to: ${CONTACT_CSV}`);
});
