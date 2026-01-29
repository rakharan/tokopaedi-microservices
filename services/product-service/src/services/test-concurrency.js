const http = require('http');

// CONFIGURATION: Ensure this ID exists in your DB and has LOW stock (e.g., 1)
const PRODUCT_ID = 1;

function buyProduct(clientId) {
    const data = JSON.stringify({
        quantity: 1
    });

    const options = {
        hostname: 'localhost',
        port: 3002,
        path: `/v1/products/${PRODUCT_ID}/decrease-stock`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`Client ${clientId}: Status ${res.statusCode} - ${body}`);
        });
    });

    req.write(data);
    req.end();
}

console.log("Starting Concurrency Test...");

// Reset stock to 1 manually before running this for best effect
// firing 5 simultaneous requests
for (let i = 1; i <= 5; i++) {
    buyProduct(i);
}