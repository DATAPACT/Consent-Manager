import express from "express";
import admin from "firebase-admin";
import { db } from "../config/firebase.js";
import "express-session";

declare module "express-session" {
  interface SessionData {
    loginSource?: "UI" | "External/API";
    userUid?: string;
  }
}

const router = express.Router();

// POST /api/auth/login - User login with Firebase Auth
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        success: false,
      });
    }

    // --- Detect login source ---
    const loginSourceHeader = req.headers["x-login-source"];
    const loginSource = loginSourceHeader === "ui" ? "UI" : "External/API";

    // --- Find user in Firestore ---
    const usersSnapshot = await db
      .collection("owners")
      .where("email", "==", email)
      .get();
    const requestersSnapshot = await db
      .collection("requesters")
      .where("email", "==", email)
      .get();

    let role = "unknown";
    let userData = null;
    let userUid = null;

    if (!usersSnapshot.empty) {
      role = "owner";
      const doc = usersSnapshot.docs[0];
      userData = doc.data();
      userUid = doc.id;
    } else if (!requestersSnapshot.empty) {
      role = "requester";
      const doc = requestersSnapshot.docs[0];
      userData = doc.data();
      userUid = doc.id;
    } else {
      return res.status(401).json({
        error: "User not found",
        success: false,
      });
    }

    // --- External API login ---
    let apiToken: any = null;
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const externalApiUrl =
        process.env.EXTERNAL_API_BASE_URL ||
        "https://dips.soton.ac.uk/negotiation-api";
      const apiResponse = await fetch(`${externalApiUrl}/user/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (apiResponse.ok) {
        const tokenText = await apiResponse.text();
        apiToken = JSON.parse(tokenText); // parse once here
        console.log(
          "External API login successful:",
          tokenText.substring(0, 50)
        );

        // --- Get MongoDB user ID if missing ---
        if (!userData?.mongoUserId) {
          try {
            const userDetailsResponse = await fetch(
              `${externalApiUrl}/user/details/`,
              {
                method: "GET",
                headers: { Authorization: `Bearer ${tokenText}` },
              }
            );

            if (userDetailsResponse.ok) {
              const userDetails = await userDetailsResponse.json();
              const mongoUserId =
                userDetails.user_id || userDetails.id || userDetails._id;

              if (mongoUserId) {
                const collection = role === "owner" ? "owners" : "requesters";
                await db.collection(collection).doc(userUid).update({
                  mongoUserId,
                  apiRegistrationSuccess: true,
                  mongoIdAddedOnLogin: true,
                  mongoIdAddedDate: new Date().toISOString(),
                });
                userData = { ...userData, mongoUserId };
              }
            }
          } catch (userDetailsError) {
            console.warn("Error fetching MongoDB user ID:", userDetailsError);
          }
        }
      }
    } catch (apiError) {
      console.log("External API login failed:", apiError);
    }

    if (!apiToken) {
      return res.status(401).json({
        error: "Invalid email or password",
        success: false,
      });
    }

    // --- Save API token in Firestore ---
    try {
      const collection = role === "owner" ? "owners" : "requesters";
      await db.collection(collection).doc(userUid).update({
        apiToken,
        apiTokenSavedOn: new Date().toISOString(),
      });
    } catch (saveError) {
      console.warn("Failed to save API token:", saveError);
    }

    // --- Store login info in session ---
    if (req.session) {
      req.session.loginSource = loginSource;
      req.session.userUid = userUid;
    }

    // --- Respond ---
    res.json({
      success: true,
      user: {
        uid: userUid,
        email,
        displayName: userData?.name || null,
        role,
        userData,
        apiToken, // already parsed
        loginSource,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({
      error: error.message || "Authentication failed",
      success: false,
    });
  }
});

// POST /api/auth/register - User registration
router.post("/register", async (req, res) => {
  try {
    console.log("========================================");
    console.log("📝 REGISTRATION REQUEST RECEIVED");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("========================================");

    const {
      email,
      password,
      name,
      role,
      type,
      masterPassword,
      ...additionalData
    } = req.body;

    console.log("📋 Parsed registration data:", {
      email,
      name,
      role,
      hasPassword: !!password,
      additionalFields: Object.keys(additionalData),
    });

    if (!email || !password || !name || !role) {
      console.error("❌ Missing required fields:", {
        hasEmail: !!email,
        hasPassword: !!password,
        hasName: !!name,
        hasRole: !!role,
      });
      return res.status(400).json({
        error: "Email, password, name, and role are required",
        success: false,
      });
    }

    if (!["owner", "requester"].includes(role)) {
      console.error("❌ Invalid role:", role);
      return res.status(400).json({
        error: 'Role must be either "owner" or "requester"',
        success: false,
      });
    }

    console.log("🔥 Creating Firebase user...");
    // Create Firebase user using Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    console.log("✅ Firebase user created:", userRecord.uid);

    // Save user data to appropriate Firestore collection
    const collection = role === "owner" ? "owners" : "requesters";
    const userData = {
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      ...additionalData,
    };

    console.log("💾 Saving to Firestore collection:", collection);
    await db.collection(collection).doc(userRecord.uid).set(userData);
    console.log("✅ Saved to Firestore");

    // External API registration
    let apiRegistrationSuccess = false;
    let mongoUserId = null;
    try {
      const externalApiUrl =
        process.env.EXTERNAL_API_BASE_URL ||
        "https://dips.soton.ac.uk/negotiation-api";
      const masterPasswordParam =
        masterPassword ||
        process.env.EXTERNAL_API_MASTER_PASSWORD ||
        "5hnd..jk4ne!kwjs?wnsmmf";
      const encodedMasterPassword = encodeURIComponent(masterPasswordParam);

      console.log("🌐 Calling negotiation API registration...");
      console.log("   URL:", `${externalApiUrl}/user/register`);
      console.log("   Email:", email);
      console.log("   Type:", role === "requester" ? "consumer" : "provider");

      const apiResponse = await fetch(
        `${externalApiUrl}/user/register?master_password_input=${encodedMasterPassword}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username_email: email,
            password: password,
            name: name,
            type: role === "requester" ? "consumer" : "provider",
          }),
        }
      );

      console.log("📡 Negotiation API response status:", apiResponse.status);

      apiRegistrationSuccess = apiResponse.ok;
      if (apiResponse.ok) {
        const successData = await apiResponse.json();
        console.log("✅ Negotiation API registration successful:", successData);

        // Extract MongoDB user ID from the response
        if (
          successData &&
          (successData.user_id || successData.id || successData._id)
        ) {
          mongoUserId =
            successData.user_id || successData.id || successData._id;
          console.log("🎯 MongoDB user ID received:", mongoUserId);

          // Update the Firebase user document with the MongoDB user ID
          console.log("💾 Updating Firebase with mongoUserId...");
          await db.collection(collection).doc(userRecord.uid).update({
            mongoUserId: mongoUserId,
            apiRegistrationSuccess: true,
            apiRegistrationDate: new Date().toISOString(),
          });
          console.log("✅ Firebase updated with mongoUserId");

          console.log(
            "✅ MongoDB user ID stored in Firebase for user:",
            userRecord.uid
          );
        } else {
          console.warn("⚠️ No user ID found in API response:", successData);
        }
      } else {
        const errorData = await apiResponse.json();
        console.error("❌ External API registration failed:", {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          error: errorData,
          email: email,
          name: name,
          role: role,
          type: role === "requester" ? "consumer" : "provider",
        });
      }
    } catch (apiError: any) {
      console.error("❌ External API registration exception:", {
        error: apiError.message,
        stack: apiError.stack,
        email: email,
        name: name,
      });
    }

    res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
        userData,
        apiRegistrationSuccess,
        mongoUserId,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: error.message || "Registration failed",
      success: false,
    });
  }
});

// POST /api/auth/logout - User logout
router.post("/logout", async (req, res) => {
  try {
    // For server-side logout, we just return success
    // Client will handle clearing local storage
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: error.message || "Logout failed",
      success: false,
    });
  }
});

// GET /api/auth/user/:uid - Get user details and role
router.get("/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const ownerDoc = await db.collection("owners").doc(uid).get();
    const requesterDoc = await db.collection("requesters").doc(uid).get();

    let role = "unknown";
    let userData = null;

    if (ownerDoc.exists) {
      role = "owner";
      userData = ownerDoc.data();
    } else if (requesterDoc.exists) {
      role = "requester";
      userData = requesterDoc.data();
    } else {
      return res.status(404).json({
        error: "User not found",
        success: false,
      });
    }

    res.json({
      success: true,
      user: {
        uid,
        role,
        userData,
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: error.message || "Failed to get user",
      success: false,
    });
  }
});

// GET /api/auth/owners - Get all owners
router.get("/owners", async (req, res) => {
  try {
    const ownersSnapshot = await db.collection("owners").get();
    const owners: { id: string; email: string; name?: string }[] = [];

    ownersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        owners.push({
          id: doc.id,
          email: data.email,
          name: data.name || "Unknown",
        });
      }
    });

    res.json({
      success: true,
      owners,
    });
  } catch (error: any) {
    console.error("Get all owners error:", error);
    res.status(500).json({
      error: error.message || "Failed to get owners",
      success: false,
    });
  }
});

// DELETE /api/auth/user/:email - Delete user from both Firebase and external API
router.delete("/user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { masterPassword } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
        success: false,
      });
    }

    console.log("Deleting user:", email);

    // First, get the user's UID from Firebase to delete from Firestore
    let userRecord = null;
    let userUid = null;

    try {
      userRecord = await admin.auth().getUserByEmail(email);
      userUid = userRecord.uid;
    } catch (authError) {
      console.log("User not found in Firebase Auth:", authError);
    }

    // Delete from external API first (if it exists there)
    let externalApiDeleteSuccess = false;
    try {
      const externalApiUrl =
        process.env.EXTERNAL_API_BASE_URL ||
        "https://dips.soton.ac.uk/negotiation-api";
      const masterPasswordParam =
        masterPassword ||
        process.env.EXTERNAL_API_MASTER_PASSWORD ||
        "5hnd..jk4ne!kwjs?wnsmmf";
      const encodedMasterPassword = encodeURIComponent(masterPasswordParam);

      // First, get the user ID from external API by email (we may need to login first to get user ID)
      // For now, we'll try to delete by email directly if the API supports it
      const deleteResponse = await fetch(
        `${externalApiUrl}/user/${email}?master_password_input=${encodedMasterPassword}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "External API delete response status:",
        deleteResponse.status
      );

      if (deleteResponse.ok) {
        console.log("User deleted from external API successfully");
        externalApiDeleteSuccess = true;
      } else {
        const errorText = await deleteResponse.text();
        console.log("External API delete failed:", errorText);
      }
    } catch (apiError) {
      console.log("External API delete failed with exception:", apiError);
    }

    // Delete from Firebase Auth
    let firebaseAuthDeleted = false;
    if (userRecord) {
      try {
        await admin.auth().deleteUser(userUid);
        firebaseAuthDeleted = true;
        console.log("User deleted from Firebase Auth");
      } catch (authDeleteError) {
        console.log(
          "Failed to delete user from Firebase Auth:",
          authDeleteError
        );
      }
    }

    // Delete from Firestore (check both collections)
    let firestoreDeleted = false;
    if (userUid) {
      try {
        const ownerDoc = db.collection("owners").doc(userUid);
        const requesterDoc = db.collection("requesters").doc(userUid);

        const ownerExists = (await ownerDoc.get()).exists;
        const requesterExists = (await requesterDoc.get()).exists;

        if (ownerExists) {
          await ownerDoc.delete();
          firestoreDeleted = true;
          console.log("User deleted from owners collection");
        }

        if (requesterExists) {
          await requesterDoc.delete();
          firestoreDeleted = true;
          console.log("User deleted from requesters collection");
        }
      } catch (firestoreError) {
        console.log("Failed to delete user from Firestore:", firestoreError);
      }
    }

    res.json({
      success: true,
      message: "User deletion completed",
      details: {
        externalApiDeleted: externalApiDeleteSuccess,
        firebaseAuthDeleted,
        firestoreDeleted,
        userFoundInFirebase: userRecord !== null,
      },
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: error.message || "Failed to delete user",
      success: false,
    });
  }
});

// GET /api/auth/token/:token - Authenticate with external API token and redirect
router.get("/token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { redirect, mode } = req.query;

    if (!token) {
      return res.status(400).json({
        error: "Token is required",
        success: false,
      });
    }

    console.log("Received token for iframe auth:", token);

    // The token might be URL encoded, so decode it first
    const decodedTokenParam = decodeURIComponent(token);
    console.log("Decoded token param:", decodedTokenParam);

    // Check if the token is the complex JSON format or just a plain JWT
    let actualJwtToken = decodedTokenParam;

    try {
      // Try to parse as JSON first (in case it's the complex format)
      const tokenObject = JSON.parse(decodedTokenParam);
      if (tokenObject.access_token) {
        actualJwtToken = tokenObject.access_token;
        console.log("Extracted JWT from complex token object");
      }
    } catch (parseError) {
      // If JSON parsing fails, assume it's already a plain JWT
      console.log("Token is already a plain JWT");
    }

    console.log("Using JWT token:", actualJwtToken);

    // Decode the JWT to get user email (without verification)
    let userEmail = null;

    try {
      // JWT has 3 parts separated by dots: header.payload.signature
      const jwtParts = actualJwtToken.split(".");
      if (jwtParts.length === 3) {
        // Decode the payload (base64)
        const payload = JSON.parse(
          Buffer.from(jwtParts[1], "base64").toString()
        );
        console.log("JWT payload:", payload);
        userEmail = payload.sub; // 'sub' usually contains the email
      }
    } catch (jwtError) {
      console.error("JWT decode error:", jwtError);
      return res.status(401).json({
        error: "Invalid JWT token format",
        success: false,
      });
    }

    if (!userEmail) {
      console.error("Could not extract email from JWT");
      return res.status(401).json({
        error: "Could not extract user email from token",
        success: false,
      });
    }

    console.log("Extracted email from JWT:", userEmail);

    // Determine role by checking Firestore collections (same logic as login endpoint)
    const usersSnapshot = await db
      .collection("owners")
      .where("email", "==", userEmail)
      .get();
    const requestersSnapshot = await db
      .collection("requesters")
      .where("email", "==", userEmail)
      .get();

    let role = "owner"; // Default fallback
    let userData = null;
    let userUid = null;
    let displayName = "Marketing Audit User";

    if (!usersSnapshot.empty) {
      role = "owner";
      const doc = usersSnapshot.docs[0];
      userData = doc.data();
      userUid = doc.id;
      displayName = userData?.name || "Marketing Audit User";
    } else if (!requestersSnapshot.empty) {
      role = "requester";
      const doc = requestersSnapshot.docs[0];
      userData = doc.data();
      userUid = doc.id;
      displayName = userData?.name || "Marketing Audit User";
    }

    console.log(
      "Determined role for token auth:",
      role,
      "for email:",
      userEmail
    );

    // Check if user has MongoDB user ID, if not, get it from external API
    if (userData && !userData.mongoUserId && actualJwtToken && userUid) {
      console.log(
        "🔍 User missing MongoDB ID during token auth, fetching from external API..."
      );

      try {
        const externalApiUrl =
          process.env.EXTERNAL_API_BASE_URL ||
          "https://dips.soton.ac.uk/negotiation-api";
        const userDetailsResponse = await fetch(
          `${externalApiUrl}/user/details/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${actualJwtToken}`,
            },
          }
        );

        if (userDetailsResponse.ok) {
          const userDetails = await userDetailsResponse.json();
          console.log(
            "📋 User details from external API (token auth):",
            userDetails
          );

          // Extract MongoDB user ID
          const mongoUserId =
            userDetails.user_id || userDetails.id || userDetails._id;

          if (mongoUserId) {
            console.log(
              "🎯 MongoDB user ID found during token auth:",
              mongoUserId
            );

            // Update Firebase user document with MongoDB user ID
            const collection = role === "owner" ? "owners" : "requesters";
            await db.collection(collection).doc(userUid).update({
              mongoUserId: mongoUserId,
              apiRegistrationSuccess: true,
              mongoIdAddedOnTokenAuth: true,
              mongoIdAddedDate: new Date().toISOString(),
            });

            console.log(
              "✅ MongoDB user ID stored in Firebase during token auth"
            );

            // Update userData in memory
            userData = { ...userData, mongoUserId };
          } else {
            console.warn(
              "⚠️ No MongoDB user ID found in external API user details (token auth)"
            );
          }
        } else {
          console.warn(
            "⚠️ Failed to get user details from external API during token auth:",
            userDetailsResponse.status
          );
        }
      } catch (userDetailsError) {
        console.warn(
          "⚠️ Error fetching user details from external API during token auth:",
          userDetailsError
        );
      }
    } else if (userData?.mongoUserId) {
      console.log(
        "✅ User already has MongoDB user ID during token auth:",
        userData.mongoUserId
      );
    }

    // Create a user object that matches the React AuthUser interface exactly
    const authUser = {
      uid:
        userUid ||
        "external_user_" +
          Buffer.from(userEmail).toString("base64").substr(0, 10),
      email: userEmail,
      displayName: displayName,
      role: role,
      userData: userData || {
        name: displayName,
        email: userEmail,
      },
      apiToken: actualJwtToken, // Use the actual JWT token
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
          const frontendUrl = '${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }';
          const redirectUrl = frontendUrl + '${
            redirect || `/ownerBase/ownerDashboard`
          }';
          const modeParam = '${mode ? `&mode=${mode}` : ""}';
          const authUrl = redirectUrl + '?auth_user=' + encodedUserData + '&auth_token=' + encodedToken + modeParam;
          
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
    res.setHeader("Content-Type", "text/html");
    res.removeHeader("X-Frame-Options"); // Remove any existing frame options
    res.setHeader("Content-Security-Policy", "frame-ancestors *"); // Allow iframe from any origin
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.send(htmlResponse);
  } catch (error) {
    console.error("Token authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
      success: false,
    });
  }
});

export default router;
