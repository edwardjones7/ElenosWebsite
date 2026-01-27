const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const WAITLIST_CSV = path.join(__dirname, 'waitlist.csv');
const CONTACT_CSV = path.join(__dirname, 'contact.csv');

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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/waitlist') {
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
    } else if (req.method === 'POST' && req.url === '/api/contact') {
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
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Waitlist emails will be saved to: ${WAITLIST_CSV}`);
    console.log(`Contact form submissions will be saved to: ${CONTACT_CSV}`);
});
