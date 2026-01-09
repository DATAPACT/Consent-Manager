import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const router = express.Router();

// GET /api/dashboard/requester/:uid - Get requester dashboard data
router.get('/requester/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const requesterDoc = await db.collection('requesters').doc(uid).get();
    if (!requesterDoc.exists) {
      return res.status(404).json({
        error: 'Requester not found',
        success: false
      });
    }

    const requesterData = requesterDoc.data()!;

    const ontologiesSnapshot = await db.collection('ontologies')
      .where('uploadedBy', '==', uid)
      .get();
    const ontologiesCount = ontologiesSnapshot.size;

    const requestsSnapshot = await db.collection('requests')
      .where('requester.requesterId', '==', uid)
      .get();

    let draftCount = 0;
    let sentCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requestsSnapshot.docs.forEach(doc => {
      const request = doc.data();
      switch (request.status) {
        case 'draft':
          draftCount++;
          break;
        case 'sent':
          sentCount++;
          break;
        case 'approved':
          approvedCount++;
          break;
        case 'rejected':
          rejectedCount++;
          break;
      }
    });

    const totalRequests = requestsSnapshot.size;

    res.json({
      success: true,
      data: {
        user: {
          name: requesterData.name,
          email: requesterData.email,
          role: 'requester'
        },
        statistics: {
          ontologiesCount,
          totalRequests,
          draftCount,
          sentCount,
          approvedCount,
          rejectedCount
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching requester dashboard:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch dashboard data',
      success: false
    });
  }
});

// GET /api/dashboard/owner/:uid - Get owner dashboard data
router.get('/owner/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const ownerDoc = await db.collection('owners').doc(uid).get();
    if (!ownerDoc.exists) {
      return res.status(404).json({
        error: 'Owner not found',
        success: false
      });
    }

    const ownerData = ownerDoc.data()!;

    const requestsSnapshot = await db.collection('requests')
      .where('owners', 'array-contains', uid)
      .get();

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requestsSnapshot.docs.forEach(doc => {
      const request = doc.data();
      if (request.ownersPending?.includes(uid)) {
        pendingCount++;
      } else if (request.ownersAccepted?.includes(uid)) {
        approvedCount++;
      } else if (request.ownersRejected?.includes(uid)) {
        rejectedCount++;
      }
    });

    const totalRequests = requestsSnapshot.size;

    res.json({
      success: true,
      data: {
        user: {
          name: ownerData.name,
          email: ownerData.email,
          role: 'owner'
        },
        statistics: {
          totalRequests,
          pendingCount,
          approvedCount,
          rejectedCount
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching owner dashboard:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch dashboard data',
      success: false
    });
  }
});

// GET /api/dashboard/requests/pending-owner/:uid - Get pending requests for owner
router.get('/requests/pending-owner/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const querySnapshot = await db.collection('requests')
      .where('ownersPending', 'array-contains', uid)
      .get();

    const pendingRequests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      requests: pendingRequests
    });

  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch pending requests',
      success: false
    });
  }
});

// GET /api/dashboard/requests/approved-owner/:uid - Get approved requests for owner
router.get('/requests/approved-owner/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const querySnapshot = await db.collection('requests')
      .where('ownersAccepted', 'array-contains', uid)
      .get();

    const approvedRequests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      requests: approvedRequests
    });

  } catch (error: any) {
    console.error('Error fetching approved requests:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch approved requests',
      success: false
    });
  }
});

export default router;
