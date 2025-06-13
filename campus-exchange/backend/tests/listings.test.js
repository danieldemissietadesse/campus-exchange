const request = require('supertest');
const app     = require('../server');           // pulls the Express app

describe('Listings API', () => {
  let createdId;

  it('✓ health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('✓ creates a listing (dev-auth bypass)', async () => {
    const res = await request(app)
      .post('/api/listings')
      .field('title', 'Jest demo')
      .field('description', 'testing')
      .field('price', 42)
      .field('category', 'Books');

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Jest demo');
    createdId = res.body.id;
  });

  it('✓ search finds the listing', async () => {
    const res = await request(app)
      .get('/api/listings')
      .query({ q: 'jest', pageSize: 5 });

    const titles = res.body.listings.map(l => l.title.toLowerCase());
    expect(titles).toContain('jest demo');
  });

  afterAll(async () => {
    // optional: clean up test doc if DELETE exists
    if (createdId) {
      await request(app).delete(`/api/listings/${createdId}`).catch(() => {});
    }
  });
});
