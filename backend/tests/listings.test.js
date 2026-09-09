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

  it('✓ saves a listing', async () => {
    const res = await request(app)
      .post(`/api/listings/${createdId}/save`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Listing saved successfully');
  });

  it('✓ fetches saved listings', async () => {
    const res = await request(app)
      .get('/api/listings/saved');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    // Check if our saved listing is in the response
    const savedTitles = res.body.map(l => l.title.toLowerCase());
    expect(savedTitles).toContain('jest demo');
  });

  it('✓ unsaves a listing', async () => {
    const res = await request(app)
      .delete(`/api/listings/${createdId}/save`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Listing unsaved successfully');
  });

  it('✓ prevents duplicate saves', async () => {
    // Save first
    await request(app).post(`/api/listings/${createdId}/save`);
    
    // Try to save again
    const res = await request(app)
      .post(`/api/listings/${createdId}/save`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Listing already saved');
  });

  it('✓ handles saving non-existent listing', async () => {
    const res = await request(app)
      .post('/api/listings/nonexistent/save');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Listing not found');
  });

  afterAll(async () => {
    // optional: clean up test doc if DELETE exists
    if (createdId) {
      await request(app).delete(`/api/listings/${createdId}`).catch(() => {});
    }
  });
});
