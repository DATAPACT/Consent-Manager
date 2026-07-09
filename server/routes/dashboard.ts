import express from 'express';
import { ObjectId } from "mongodb";
import { db } from "../config/database.service.ts";

const router = express.Router();

// GET /api/dashboard/requester/:uid - Get requester dashboard data
router.get('/requester/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const requesterCollection = db.collection('users');
    const requesterData = await requesterCollection.findOne({_id:new ObjectId(uid)});
    console.log("Requester doc is:",requesterData);
    if (!requesterData) {
      return res.status(404).json({
        error: 'Requester not found',
        success: false
      });
    }

    const ontologiesSnapshot = await db.collection('ontologies')
      .find({ 'uploadedBy': {$eq: uid}}).toArray();
      
    const ontologiesCount = ontologiesSnapshot.length;

    const requestsSnapshot = await db.collection('requests')
      .find({'requester.requesterId': {$eq: uid}})
      .toArray();

    let draftCount = 0;
    let sentCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requestsSnapshot.forEach(doc => {
      const request = doc;
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

    const totalRequests = requestsSnapshot.length;

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

    const ownerDoc = await db.collection('owners').findOne({_id:new ObjectId(uid), 'type': "provider"});
    if (!ownerDoc) {
      return res.status(404).json({
        error: 'Owner not found',
        success: false
      });
    }

    const ownerData = ownerDoc.data()!;

    const requestsSnapshot = await db.collection('requests')
    .find({ 'owners': {$elemMatch: { $eq: uid }}})
    .toArray();

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requestsSnapshot.forEach(doc => {
      const request = doc;
      if (request.ownersPending?.includes(uid)) {
        pendingCount++;
      } else if (request.ownersAccepted?.includes(uid)) {
        approvedCount++;
      } else if (request.ownersRejected?.includes(uid)) {
        rejectedCount++;
      }
    });

    const totalRequests = requestsSnapshot.length;

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

    const querySnapshot = db.collection('requests')
      .find({'ownersPending': {$elemMatch: { $eq: uid }}});

    const pendingRequests = await querySnapshot.toArray();

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

    const querySnapshot = db.collection('requests')
      .find({'ownersAccepted': {$elemMatch: { $eq: uid }}});

    const approvedRequests = await querySnapshot.toArray();

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
