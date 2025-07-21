const request = require('supertest');
const app = require('../server');

describe('Auth Middleware', () => {
  
  it('✓ allows dev-auth bypass in test environment', async () => {
    const res = await request(app)
      .get('/api/listings');

    expect(res.statusCode).toBe(200);
    // Should work without authorization header in test mode
  });

  it('✓ rejects requests without proper auth in production mode', async () => {
    // Temporarily set to production mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .get('/api/listings');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No auth token provided');

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('✓ accepts valid Bearer token format', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .get('/api/listings')
      .set('Authorization', 'Bearer invalid-token-but-proper-format');

    // Should get 403 (unauthorized) not 401 (no token)
    // This means the middleware processed the token but Firebase rejected it
    expect(res.statusCode).toBe(403);

    process.env.NODE_ENV = originalEnv;
  });

  it('✓ rejects malformed authorization header', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .get('/api/listings')
      .set('Authorization', 'InvalidFormat token-here');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No auth token provided');

    process.env.NODE_ENV = originalEnv;
  });
});