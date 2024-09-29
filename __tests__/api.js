const axios = require('axios');

describe('Testing API Endpoints', () => {
    test('Testing GET /api/posts', async () => {
        const res = await axios.get('http://localhost:3000/api/posts');
        expect(Array.isArray(res.data)).toBe(true);
    });

    test('Testing POST /api/posts', async () => {
        const res = await axios.post('http://localhost:3000/api/posts', {
            'username': 'admin',
            'password': 'examplePassword123',
            'content': 'Test Post'
        });

        expect(res.data.message).toBe('Post created successfully.');
    });
});