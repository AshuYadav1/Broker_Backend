import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 users
        { duration: '1m', target: 500 }, // Spike to 500 users
        { duration: '30s', target: 0 },  // Scale down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must be < 500ms
    },
};

const BASE_URL = 'http://localhost:3000'; // Change to VPS IP in production

export default function () {
    // Test 1: Get Properties (Cached & Rate Limited)
    const res = http.get(`${BASE_URL}/properties`);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'content type is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    sleep(1);
}
