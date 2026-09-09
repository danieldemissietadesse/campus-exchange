const request = require('supertest');
const app = require('../server');

describe('Notifications API', () => {

  it('✓ fetches user notifications', async () => {
    const res = await request(app)
      .get('/api/notifications');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('✓ marks notification as read', async () => {
    // First, send a message to create a notification
    await request(app)
      .post('/api/messages')
      .send({ 
        recipientId: 'dev-tester-uid', 
        message: 'test notification message',
        listingId: 'test-listing-id'
      });

    // Get notifications to find one to mark as read
    const notificationsRes = await request(app)
      .get('/api/notifications');

    if (notificationsRes.body.length > 0) {
      const notificationId = notificationsRes.body[0].id;
      
      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/read`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Notification marked as read');
    }
  });

  it('✓ handles marking non-existent notification as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/nonexistent/read');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Notification not found');
  });
});