// Using native fetch
// If node-fetch not installed, we can rely on native fetch in Node 18+ (User has Node 20 types, so likely Node 20+).

const DEVICE_API = 'http://localhost:5001/api';
const VALID_CODE = 'TAP8-8842-SYSA-CT00';

async function fetchJson(url: string, options: any = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
        if (!res.ok) console.log(`❌ Error ${res.status}:`, text);
        return JSON.parse(text);
    } catch (e) {
        console.log('❌ Invalid JSON:', text);
        throw e;
    }
}

async function runTests() {
    console.log('🧪 Starting Backend Verification (Single-PIN Flow)...');

    // 1. Check Health
    console.log('\n--- Test 1: Check Backend Health ---');
    try {
        let health = await fetchJson(`http://localhost:5001/health`);
        console.log('Health:', health);
    } catch (e) {
        console.log('❌ Backend not reachable. Is it running?');
        return;
    }

    let restaurantId = '';

    // 2. Activate Device
    console.log('\n--- Test 2: Activate Device ---');
    try {
        const activation = await fetchJson(`${DEVICE_API}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activationCode: VALID_CODE })
        });
        console.log('Activation Result:', activation);
        restaurantId = activation.restaurantId;
    } catch (e) {
        console.log('Activation failed');
    }

    if (!restaurantId) {
        console.log('❌ Cannot proceed without restaurant ID');
        return;
    }

    // 3. Setup PIN (Registration)
    console.log('\n--- Test 3: Setup Master PIN ---');
    try {
        const setup = await fetchJson(`${DEVICE_API}/setup-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurantId, adminPin: '123456', kitchenPin: '1234' })
        });
        console.log('Setup Result:', setup);
    } catch (e) {
        console.log('Setup PIN failed');
    }

    // 4. Login with PIN
    console.log('\n--- Test 4: Login with Master PIN ---');
    try {
        const login = await fetchJson(`${DEVICE_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: '123456', deviceId: 'TEST-DEVICE-001', role: 'ADMIN' })
        });
        console.log('Login Result:', login);
    } catch (e) {
        console.log('Login failed');
    }

    console.log('\n✅ Verification Complete');
}

runTests().catch(console.error);
