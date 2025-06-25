import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const router = express.Router();

// POST /api/auth/login - User login with Firebase Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        success: false
      });
    }

    // For server-side auth, we need to verify the user exists and password is correct
    // Since we can't directly authenticate with password on server side, 
    // we'll need to use a different approach or rely on client-side auth
    
    // First, try to find the user by email
    const usersSnapshot = await db.collection('owners').where('email', '==', email).get();
    const requestersSnapshot = await db.collection('requesters').where('email', '==', email).get();

    let role = 'unknown';
    let userData = null;
    let userUid = null;

    if (!usersSnapshot.empty) {
      role = 'owner';
      const doc = usersSnapshot.docs[0];
      userData = doc.data();
      userUid = doc.id;
    } else if (!requestersSnapshot.empty) {
      role = 'requester';
      const doc = requestersSnapshot.docs[0];
      userData = doc.data();
      userUid = doc.id;
    } else {
      return res.status(401).json({
        error: 'User not found',
        success: false
      });
    }

    // External API login for hybrid auth
    let apiToken = null;
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const apiResponse = await fetch('https://dips.soton.ac.uk/negotiation-api/user/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (apiResponse.ok) {
        // The response is a plain text JWT token, not JSON
        apiToken = await apiResponse.text();
        console.log('External API login successful, token received');
      } else {
        console.log('External API login failed with status:', apiResponse.status);
      }
    } catch (apiError) {
      console.log('External API login failed:', apiError);
    }

    res.json({
      success: true,
      user: {
        uid: userUid,
        email: email,
        displayName: userData?.name || null,
        role,
        userData,
        apiToken
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({
      error: error.message || 'Authentication failed',
      success: false
    });
  }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, type, masterPassword, ...additionalData } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: 'Email, password, name, and role are required',
        success: false
      });
    }

    if (!['owner', 'requester'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be either "owner" or "requester"',
        success: false
      });
    }

    // Create Firebase user using Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Save user data to appropriate Firestore collection
    const collection = role === 'owner' ? 'owners' : 'requesters';
    const userData = {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      ...additionalData
    };

    await db.collection(collection).doc(userRecord.uid).set(userData);

    // External API registration
    let apiRegistrationSuccess = false;
    try {
      const masterPasswordParam = masterPassword || "5hnd..jk4ne!kwjs?wnsmmf";
      const apiResponse = await fetch(
        `https://dips.soton.ac.uk/negotiation-api/user/register?master_password_input=${masterPasswordParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username_email: email,
            password: password,
            name: name,
            type: type || "consumer"
          }),
        }
      );

      apiRegistrationSuccess = apiResponse.ok;
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.log('External API registration failed:', errorData);
      }
    } catch (apiError) {
      console.log('External API registration failed:', apiError);
    }

    res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
        userData,
        apiRegistrationSuccess
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({
      error: error.message || 'Registration failed',
      success: false
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    // For server-side logout, we just return success
    // Client will handle clearing local storage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: error.message || 'Logout failed',
      success: false
    });
  }
});

// GET /api/auth/user/:uid - Get user details and role
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const ownerDoc = await db.collection('owners').doc(uid).get();
    const requesterDoc = await db.collection('requesters').doc(uid).get();

    let role = 'unknown';
    let userData = null;

    if (ownerDoc.exists) {
      role = 'owner';
      userData = ownerDoc.data();
    } else if (requesterDoc.exists) {
      role = 'requester';
      userData = requesterDoc.data();
    } else {
      return res.status(404).json({
        error: 'User not found',
        success: false
      });
    }

    res.json({
      success: true,
      user: {
        uid,
        role,
        userData
      }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get user',
      success: false
    });
  }
});

export default router;