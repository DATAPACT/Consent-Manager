import express from 'express';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

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

    // Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role from Firestore
    const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
    const requesterDoc = await getDoc(doc(db, 'requesters', user.uid));

    let role = 'unknown';
    let userData = null;

    if (ownerDoc.exists()) {
      role = 'owner';
      userData = ownerDoc.data();
    } else if (requesterDoc.exists()) {
      role = 'requester';
      userData = requesterDoc.data();
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
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
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

    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user data to appropriate Firestore collection
    const collection = role === 'owner' ? 'owners' : 'requesters';
    const userData = {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      ...additionalData
    };

    await setDoc(doc(db, collection, user.uid), userData);

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
        uid: user.uid,
        email: user.email,
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
    await signOut(auth);
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

    const ownerDoc = await getDoc(doc(db, 'owners', uid));
    const requesterDoc = await getDoc(doc(db, 'requesters', uid));

    let role = 'unknown';
    let userData = null;

    if (ownerDoc.exists()) {
      role = 'owner';
      userData = ownerDoc.data();
    } else if (requesterDoc.exists()) {
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