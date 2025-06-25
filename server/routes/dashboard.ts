import express from 'express';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const router = express.Router();

// GET /api/dashboard/requester/:uid - Get requester dashboard data
router.get('/requester/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Get requester data
    const requesterDoc = await getDoc(doc(db, 'requesters', uid));
    if (!requesterDoc.exists()) {
      return res.status(404).json({
        error: 'Requester not found',
        success: false
      });
    }

    const requesterData = requesterDoc.data();

    // Get ontologies count
    const ontologiesQuery = query(
      collection(db, 'ontologies'),
      where('uploadedBy', '==', uid)
    );
    const ontologiesSnapshot = await getDocs(ontologiesQuery);
    const ontologiesCount = ontologiesSnapshot.size;

    // Get requests count by status
    const requestsQuery = query(
      collection(db, 'requests'),
      where('requester.requesterId', '==', uid)
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    
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

    // Get owner data
    const ownerDoc = await getDoc(doc(db, 'owners', uid));
    if (!ownerDoc.exists()) {
      return res.status(404).json({
        error: 'Owner not found',
        success: false
      });
    }

    const ownerData = ownerDoc.data();

    // Get requests where this owner is involved
    const requestsQuery = query(
      collection(db, 'requests'),
      where('owners', 'array-contains', uid)
    );
    const requestsSnapshot = await getDocs(requestsQuery);

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requestsSnapshot.docs.forEach(doc => {
      const request = doc.data();
      
      // Check owner's status in this request
      if (request.ownersPending && request.ownersPending.includes(uid)) {
        pendingCount++;
      } else if (request.ownersAccepted && request.ownersAccepted.includes(uid)) {
        approvedCount++;
      } else if (request.ownersRejected && request.ownersRejected.includes(uid)) {
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

    const requestsQuery = query(
      collection(db, 'requests'),
      where('ownersPending', 'array-contains', uid)
    );
    
    const querySnapshot = await getDocs(requestsQuery);
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

    const requestsQuery = query(
      collection(db, 'requests'),
      where('ownersAccepted', 'array-contains', uid)
    );
    
    const querySnapshot = await getDocs(requestsQuery);
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