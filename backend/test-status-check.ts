
import axios from 'axios';

async function main() {
    try {
        console.log('🧪 Testing /api/device/status ...');
        const res = await axios.get('http://localhost:5001/api/device/status');
        console.log('Response Status:', res.status);
        console.log('Response Data:', res.data);

        if (res.data.forceActivation === true && res.data.restaurantStatus === 'REVOKED') {
            console.log('✅ Correctly reports forceActivation=true for REVOKED status.');
        } else {
            console.error('❌ Unexpected response for REVOKED status.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
