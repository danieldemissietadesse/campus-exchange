const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

/* ────────── POST /api/notifications/send ────────── */
router.post('/send', async (req, res) => {
  try {
    const { recipientId, type, title, message, listingId, metadata } = req.body;
    // Use the senderId from auth middleware
    const senderId = req.userUid;

    // Check if recipient has email notifications enabled
    const recipientDoc = await db.collection('users').doc(recipientId).get();
    if (!recipientDoc.exists) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipientData = recipientDoc.data();
    if (!recipientData.emailNotifications) {
      return res.status(200).json({ message: 'Notification not sent - user has notifications disabled' });
    }

    // Create notification record
    const notification = {
      senderId,
      recipientId,
      type, // 'message', 'listing_interest', 'listing_sold', etc.
      title,
      message,
      listingId: listingId || null,
      metadata: metadata || {},
      read: false,
      emailSent: false, // Would be true when actual email is sent
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const notificationRef = await db.collection('notifications').add(notification);

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // For now, we just log that an email would be sent
    console.log(`Email notification would be sent to ${recipientData.email}:`, {
      subject: title,
      body: message,
      listingId
    });

    // Mark as email sent (simulated)
    await notificationRef.update({ emailSent: true });

    res.status(200).json({ 
      message: 'Notification sent successfully',
      notificationId: notificationRef.id 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

/* ────────── GET /api/notifications ────────── */
router.get('/', async (req, res) => {
  try {
    // Use the userId from auth middleware
    const userId = req.userUid;

    const notifications = await db.collection('notifications')
      .where('recipientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notificationList = notifications.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(notificationList);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/* ────────── PATCH /api/notifications/:id/read ────────── */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    // Use the userId from auth middleware
    const userId = req.userUid;

    // Verify the notification belongs to the current user
    const notificationDoc = await db.collection('notifications').doc(id).get();
    if (!notificationDoc.exists) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notificationDoc.data().recipientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('notifications').doc(id).update({
      read: true,
      readAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;