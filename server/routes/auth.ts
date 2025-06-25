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

      const externalApiUrl = process.env.EXTERNAL_API_BASE_URL || 'https://dips.soton.ac.uk/negotiation-api';
      const apiResponse = await fetch(`${externalApiUrl}/user/login/`, {
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
        apiToken: apiToken || null // Just return the plain JWT token
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
      const externalApiUrl = process.env.EXTERNAL_API_BASE_URL || 'https://dips.soton.ac.uk/negotiation-api';
      const masterPasswordParam = masterPassword || "5hnd..jk4ne!kwjs?wnsmmf";
      const apiResponse = await fetch(
        `${externalApiUrl}/user/register?master_password_input=${masterPasswordParam}`,
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

// GET /api/auth/owners - Get all owners
router.get('/owners', async (req, res) => {
  try {
    const ownersSnapshot = await db.collection('owners').get();
    const owners: { id: string; email: string; name?: string }[] = [];

    ownersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        owners.push({
          id: doc.id,
          email: data.email,
          name: data.name || 'Unknown',
        });
      }
    });

    res.json({
      success: true,
      owners
    });

  } catch (error: any) {
    console.error('Get all owners error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get owners',
      success: false
    });
  }
});

// GET /api/auth/token/:token - Authenticate with external API token and redirect
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { redirect } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
        success: false
      });
    }

    console.log('Received token for iframe auth:', token);
    
    // The token might be URL encoded, so decode it first
    const decodedTokenParam = decodeURIComponent(token);
    console.log('Decoded token param:', decodedTokenParam);
    
    // Check if the token is the complex JSON format or just a plain JWT
    let actualJwtToken = decodedTokenParam;
    
    try {
      // Try to parse as JSON first (in case it's the complex format)
      const tokenObject = JSON.parse(decodedTokenParam);
      if (tokenObject.access_token) {
        actualJwtToken = tokenObject.access_token;
        console.log('Extracted JWT from complex token object');
      }
    } catch (parseError) {
      // If JSON parsing fails, assume it's already a plain JWT
      console.log('Token is already a plain JWT');
    }
    
    console.log('Using JWT token:', actualJwtToken);
    
    // Decode the JWT to get user email (without verification)
    let userEmail = null;
    
    try {
      // JWT has 3 parts separated by dots: header.payload.signature
      const jwtParts = actualJwtToken.split('.');
      if (jwtParts.length === 3) {
        // Decode the payload (base64)
        const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
        console.log('JWT payload:', payload);
        userEmail = payload.sub; // 'sub' usually contains the email
      }
    } catch (jwtError) {
      console.error('JWT decode error:', jwtError);
      return res.status(401).json({
        error: 'Invalid JWT token format',
        success: false
      });
    }
    
    if (!userEmail) {
      console.error('Could not extract email from JWT');
      return res.status(401).json({
        error: 'Could not extract user email from token',
        success: false
      });
    }
    
    console.log('Extracted email from JWT:', userEmail);
    
    // Create a user object that matches the React AuthUser interface exactly
    const authUser = {
      uid: 'external_user_' + Buffer.from(userEmail).toString('base64').substr(0, 10),
      email: userEmail,
      displayName: 'Marketing Audit User',
      role: 'owner',
      userData: {
        name: 'Marketing Audit User',
        email: userEmail
      },
      apiToken: actualJwtToken // Use the actual JWT token
    };

    // Return an HTML page that sets localStorage and redirects
    const frontendAuthScript = `
      <script>
        try {
          console.log('Authentication successful!');
          
          // Redirect to React app with auth data in URL parameters
          const userData = ${JSON.stringify(authUser)};
          const token = '${actualJwtToken}';
          
          console.log('User data to pass:', userData);
          console.log('Token to pass:', token);
          
          // Encode the user data and token for URL parameters
          const encodedUserData = encodeURIComponent(JSON.stringify(userData));
          const encodedToken = encodeURIComponent(token);
          
          // Redirect with auth data as URL parameters
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const redirectUrl = frontendUrl + '${redirect || `/ownerBase/ownerDashboard`}';
          const authUrl = redirectUrl + '?auth_user=' + encodedUserData + '&auth_token=' + encodedToken;
          
          console.log('Redirecting to:', authUrl);
          window.location.href = authUrl;
          
        } catch (error) {
          console.error('Auth error:', error);
          document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h3>Authentication Error</h3><p>Please try again or contact support.</p><p>Error: ' + error.message + '</p></div>';
        }
      </script>
    `;

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .loader { text-align: center; }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h3>Authenticating...</h3>
          <p>Please wait while we log you in.</p>
        </div>
        ${frontendAuthScript}
      </body>
      </html>
    `;

    // Set headers to allow iframe embedding
    res.setHeader('Content-Type', 'text/html');
    res.removeHeader('X-Frame-Options'); // Remove any existing frame options
    res.setHeader('Content-Security-Policy', 'frame-ancestors *'); // Allow iframe from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.send(htmlResponse);

  } catch (error) {
    console.error('Token authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      success: false
    });
  }
});

export default router;