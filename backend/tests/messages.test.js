const request = require('supertest');
const app     = require('../server');

describe('Messages API', () => {

  it('✓ sends a message to self', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ recipientId: 'dev-tester-uid', message: 'hello from Jest' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('hello from Jest');
  });

  it('✓ fetches the message via GET', async () => {
    const res = await request(app).get('/api/messages');
    const texts = res.body.map(m => m.message);
    expect(texts).toContain('hello from Jest');
  });
});
