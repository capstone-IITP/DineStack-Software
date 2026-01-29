const http = require('http');

const HOST = 'localhost';
const PORT = 5001;
const SUPER_ADMIN_PIN = '1999';
const ACTIVATION_CODE = 'TAP8-8842-SYSA-CT00';

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testReset() {
    console.log('🧪 Starting Device Reset Test (Native HTTP)...');

    // 1. Reset Device
    console.log('👉 Requesting Device Reset...');
    try {
        const resetRes = await request('/admin/reset-device', 'POST', { superAdminPin: SUPER_ADMIN_PIN });
        console.log(`Reset Response (${resetRes.status}):`, resetRes.body);
    } catch (e) {
        console.log("Error calling reset:", e.message);
    }

    // 2. Try Re-Activate
    console.log('👉 Requesting Re-Activation...');
    try {
        const activateRes = await request('/activate', 'POST', { activationCode: ACTIVATION_CODE });
        console.log(`Activation Response (${activateRes.status}):`, activateRes.body);
    } catch (e) {
        console.log("Error calling activate:", e.message);
    }
}

testReset();
