import express from "express";
import { db } from "../../src/services/database.service.ts";
import "express-session";
import keycloak, { login, verify } from "../config/keycloak.ts";
import { ObjectId } from "mongodb";
import { sendTestEmail } from "../config/nodemailer.ts";
import { decodeJwt, jwtVerify } from "jose";

declare module "express-session" {
  interface SessionData {
    loginSource?: "UI" | "External/API";
    userUid?: string;
  }
}

const router = express.Router();
const secret = new TextEncoder().encode(process.env.EMAIL_LINK_SECRET!);

// POST /api/auth/login - User login with keycloak
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

    let role = "unknown";
    let userData = null;
    let userUid = null;
    let apiToken = null;

    // --- External API login ---
    try {
      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("username", email);
      formData.append("password", password);
      formData.append("client_id","consent-manager");

      apiToken = await login(email, password);
      console.log("Response is:",apiToken);

      if (apiToken) {
        const access_token = apiToken.access_token;
        console.log(
          "External API login successful:",
          access_token.substring(0, 50)
        );
        console.log("Decoded token:",keycloak.jwt.decode(access_token));

          try {
            const detailsForm = new URLSearchParams({user_email: email});
            const userManagementServiceURL = process.env.USER_MANAGEMENT_SERVICE_API_URL || "";
            const userDetailsResponse = await fetch(
              `${userManagementServiceURL}/user/details/?${detailsForm}`,
              {
                method: "GET",
                headers: { Authorization: `Bearer ${apiToken}` },
              }
            );

            console.log("User details response:",userDetailsResponse);

            if (userDetailsResponse.ok) {
              userData = await userDetailsResponse.json();
              userUid = userData._id;
            }
            else {
              console.warn("Error fetching user details:", userDetailsResponse.statusText);
            }
          } catch (userDetailsError) {
            console.warn("Error fetching user details:", userDetailsError);
          }
      }
    } catch (apiError) {
      console.log("External API login failed:", apiError);
    }

    if (!apiToken) {
      return res.status(401).json({
        error: "External API login failed",
        success: false,
      });
    }

    // --- Store login info in session ---
    if (req.session) {
      req.session.loginSource = loginSource;
      req.session.userUid = userUid;
    }

    console.log("User data is:",userData);

    if (userData.type === 'consumer'){
      role = "requester";
    }
    else if (userData.type === 'provider'){
      role = "owner";
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
    res.status(403).json({
      error: error.message || "Authentication failed",
      success: false,
    });
  }
});

router.post("/create", async (req, res) => { //TODO: add authentication
  try {
    console.log("========================================");
    console.log("REGISTRATION REQUEST FOR NEW USER");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("========================================");

    const {
      email,
      role,
      type,
      ...additionalData
    } = req.body;

    if (!req.headers.authorization?.startsWith("Bearer ")) {
          return res.status(401).json({
            success: false,
            error: "Missing bearer token",
          });
        }
    
    const token = req.headers.authorization.substring(7);
    const verification = await verify(token);

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

    if (!email || !role) {
      console.error("Missing required fields:", {
        hasEmail: !!email,
        hasRole: !!role,
      })
      return res.status(400).json({
        error: "Email and role are required",
        success: false,
      })
    }

    if (role !== "owner") {
      console.error("Invalid role. This function can only create users who are owners.")
      return res.status(400).json({
        error: 'Role must be "owner"',
        success: false,
      })
    }

    const email_details = {
      from: 'DIPS Consent Manager <dips-consent-manager@soton.ac.uk>',
      to: email,
      subject: 'Consent Request',
      html: '<p>Please click the link to consent:</p><p><a href="LINK">Consent</a></p><p>Or click the following link to reject:</p><p><a href="LINK">Reject</a></p>',
    }
    const email_result = await sendTestEmail(email_details);

    if (email_result.success) {
      console.log("Email sent successfully. Preview URL:", email_result.url);
    }
    else {
      return res.status(405).json({
        error: 'Unable to send email',
        success: false,
      }) 
    }

    // Save user data to appropriate Firestore collection
    const userData = {
      name: "default",
      email,
      role: "owner",
      createdAt: new Date().toISOString(),
      ...additionalData,
    };

    let apiRegistrationSuccess = false;
    let uid = null;
    let userRecord = null;
    try {
      const externalApiUrl =
        process.env.USER_MANAGEMENT_SERVICE_API_URL ||
        "https://dips.soton.ac.uk/negotiation-api";
      const masterPasswordParam = process.env.MASTER_PASSWORD || "master_password";

      const encodedMasterPassword = encodeURIComponent(masterPasswordParam);

      console.log("Calling API registration...");
      console.log("URL:", `${externalApiUrl}/user/register`);
      console.log("Email:", email);
      console.log("Type:", role === "requester" ? "consumer" : "provider");

      const fallback = "unknown";

      const registrationPayload = {
        username_email: email,
        username: email.includes("@") ? email.split("@")[0] : email,
        password: "Random_Password_For_Testing_13!",
        name: fallback,
        type: "provider",
      
        incorporation: additionalData?.incorporation?.trim() || fallback,
        address: additionalData?.address?.trim() || fallback,
        position_title: additionalData?.positionTitle?.trim() || fallback,
        vat_no: additionalData?.VAT_No?.trim() || fallback,
        phone: additionalData?.phone?.trim() || fallback,
        organization: additionalData?.organization || [fallback],
      };

      const apiResponse = await fetch(
        `${externalApiUrl}/user/register?master_password_input=${encodedMasterPassword}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationPayload),
        }
      );

      console.log("API response status:", apiResponse.status);

      apiRegistrationSuccess = apiResponse.ok;
      if (apiResponse.ok) {
        const successData = await apiResponse.json();
        userRecord = successData;
        console.log("User Management Service API registration successful:", successData);

        // Extract MongoDB user ID from the response
        if (
          successData &&
          (successData.user_id || successData.id || successData._id)
        ) {
          uid = successData.user_id || successData.id || successData._id;
          console.log("MongoDB user ID received:", uid);
        } else {
          console.warn("No user ID found in API response:", successData);
        }
      } else {
        const errorData = await apiResponse.json();
        console.error("External API registration failed:", {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          error: errorData,
          email: email,
          role: "owner",
          type: "provider",
        });
      }

    } catch (apiError: any) {
      console.error("External API registration exception:", {
        error: apiError.message,
        stack: apiError.stack,
        email: email,
      });
    }

    res.status(201).json({
      success: true,
      user: {
        uid,
        email: userRecord.email,
        role: "owner",
        userData,
        apiRegistrationSuccess,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: error.message || "Registration failed",
      success: false,
    });
  }
})

router.post("/update", async (req, res) => {
  try {
    console.log("========================================");
    console.log("📝 UPDATE REQUEST RECEIVED");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("========================================");

    const {
      email,
      password,
      new_password,
      confirm_password,
      name,
      role,
      type,
      uid,
      ...additionalData
    } = req.body;

    console.log("Parsed user data:", {
      email,
      name,
      role,
      hasPassword: !!password,
      additionalFields: Object.keys(additionalData),
    });

    if (!email || !password || !name || !role) {
      console.error("Missing required fields:", {
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
      console.error("Invalid role:", role);
      return res.status(400).json({
        error: 'Role must be either "owner" or "requester"',
        success: false,
      });
    }

    if (new_password !== confirm_password) {
      console.error("New passwords do not match.");
      return res.status(400).json({
        error: 'New passwords do not match.',
        success: false,
      });
    }

    let apiToken: any = null;
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    // Save user data to appropriate Firestore collection
    const collection = role === "owner" ? "owners" : "requesters";
    const userData = {
      name,
      email,
      role,
      updatedAt: new Date().toISOString(),
      ...additionalData,
    };

    // External API registration
    let apiRegistrationSuccess = false;
    let mongoUserId = null;
    let userRecord = null;
    try {
      const externalApiUrl =
        process.env.USER_MANAGEMENT_SERVICE_API_URL ||
        "https://dips.soton.ac.uk/negotiation-api";
      const masterPasswordParam = process.env.MASTER_PASSWORD || "master_password";

      const encodedMasterPassword = encodeURIComponent(masterPasswordParam);

      console.log("Calling negotiation API registration...");
      console.log("URL:", `${externalApiUrl}/user/update-password`);
      console.log("Email:", email);
      console.log("Type:", role === "requester" ? "consumer" : "provider");

      const apiResponse = await fetch(
        `${externalApiUrl}/user/update-password?master_password_input=${encodedMasterPassword}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username_email: email,
            password: new_password,
            name: name,
            type: role === "requester" ? "consumer" : "provider",
          }),
        }
      );

      console.log("Negotiation API response status:", apiResponse.status);

      apiRegistrationSuccess = apiResponse.ok;
      if (apiResponse.ok) {
        const successData = await apiResponse.json();
        userRecord = successData;
        console.log("Negotiation API password changed successfully:", successData);

        // Extract MongoDB user ID from the response
      } else {
        const errorData = await apiResponse.json();
        console.error("External API registration failed:", {
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
      console.error("External API registration exception:", {
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
    console.error("Update error:", error);
    res.status(400).json({
      error: error.message || "Update failed",
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
      ...additionalData
    } = req.body;

    console.log("Parsed registration data:", {
      email,
      name,
      role,
      hasPassword: !!password,
      additionalFields: Object.keys(additionalData),
    });

    if (!email || !password || !name || !role) {
      console.error("Missing required fields:", {
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
      console.error("Invalid role:", role);
      return res.status(400).json({
        error: 'Role must be either "owner" or "requester"',
        success: false,
      });
    }

    // External API registration
    let apiRegistrationSuccess = false;
    let userRecord = null;
    let userData = null;
    try {
      const externalApiUrl =
        process.env.USER_MANAGEMENT_SERVICE_API_URL ||
        "https://dips.soton.ac.uk/negotiation-api";

      const masterPasswordParam = process.env.MASTER_PASSWORD || "master_password";

      const encodedMasterPassword = encodeURIComponent(masterPasswordParam);

      console.log("Calling user management service API registration...");
      console.log("URL:", `${externalApiUrl}/user/register`);
      console.log("Email:", email);
      console.log("Type:", role === "requester" ? "consumer" : "provider");

      const fallback = "unknown";
 
      const registrationPayload = {
        username_email: email,
        username: email.includes("@") ? email.split("@")[0] : email,
        password: password,
        name: name,
        type: role === "requester" ? "consumer" : "provider",
      
        incorporation: additionalData?.incorporation?.trim() || fallback,
        address: additionalData?.address?.trim() || fallback,
        position_title: additionalData?.positionTitle?.trim() || fallback,
        vat_no: additionalData?.VAT_No?.trim() || fallback,
        phone: additionalData?.phone?.trim() || fallback,
        organization: additionalData?.organization || [fallback],
      };

      const apiResponse = await fetch(
        `${externalApiUrl}/user/register?master_password_input=${encodedMasterPassword}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationPayload),
        }
      );

      console.log("API response status:", apiResponse.status);

      apiRegistrationSuccess = apiResponse.ok;
      if (apiResponse.ok) {
        const successData = await apiResponse.json();
        userRecord = successData;
        console.log("API registration successful:", successData);

      } else {
        const errorData = await apiResponse.json();
        console.error("External API registration failed:", {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          error: errorData,
          payload: JSON.stringify(registrationPayload)
        });
      }
    } catch (apiError: any) {
      console.error("External API registration exception:", {
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

    const userDoc = await db.collection("users").findOne({_id: {$eq: new ObjectId(uid)}});

    let role = "unknown";
    let userData = null;

    if (userDoc) {
      if (userDoc.type === "consumer") {
        role = "requester";
      }
      else if (userDoc.type === "provider") {
        role = "owner";
      }
      userData = userDoc;
    }
    else {
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
    const ownersSnapshot = await db.collection("users").find({type: {$eq: "provider"}}).toArray();
    const owners: { id: string; email: string; name?: string }[] = [];

    ownersSnapshot.forEach((doc) => {
      const data = doc;
      if (data.username_email) {
        owners.push({
          id: doc._id.toString(),
          email: data.username_email,
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

    if (!req.headers.authorization?.startsWith("Bearer ")) {
          return res.status(401).json({
            success: false,
            error: "Missing bearer token",
          });
        }
    
    const token = req.headers.authorization.substring(7);
    const verification = await verify(token);

    if (!verification) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }

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

    // Delete from external API first (if it exists there)
    let externalApiDeleteSuccess = false;
    try {
      const externalApiUrl =
        process.env.EXTERNAL_API_BASE_URL ||
        "https://dips.soton.ac.uk/negotiation-api";
      const masterPasswordParam =
        masterPassword ||
        process.env.EXTERNAL_API_MASTER_PASSWORD;
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

    res.json({
      success: true,
      message: "User deletion completed",
      details: {
        externalApiDeleted: externalApiDeleteSuccess,
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


//The link in the emails we send to new users created by a requester points to this API call.
//It will create a new user, login the user and redirect to the page where the user can accept or reject the request.
//The provided token should contain all the relevant information such as the requestId, the user's email address.
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { payload } = await jwtVerify(token, secret);
    if (!payload) {
      return res.status(401).json({
        error: "Invalid token",
        success: false,
      });
    }
    const decoded_token = decodeJwt(token);
    console.log("Decoded token payload is:");
    console.log(decoded_token);

    if (!decoded_token.email) {
      return res.status(401).json({
        error: "Email address missing",
        success: false,
      });
    }

    if (!decoded_token.requestId) {
      return res.status(401).json({
        error: "Request id missing",
        success: false,
      });
    }
    
    const requestId = decoded_token.requestId;
    const verification = await db.collection("tokens").findOne({token: {$eq: decoded_token.token}});

    if (!verification) {
      return res.status(401).json({
        error: "Token verification failed",
        success: false,
      });
    }

    if (verification.used) {
      return res.status(401).json({
        error: "Token already used",
        success: false,
      });
    }

    if (Date.now() > verification.expiresAt) {
      //TODO: Renew token?
      return res.status(401).json({
        error: "Token is expired",
        success: false,
      });
    }

    console.log("Creating new user");
    try {
      const email = decoded_token.email.toString();

      let uid = null;
      let userRecord = null;
      try {
        const externalApiUrl =
          process.env.USER_MANAGEMENT_SERVICE_API_URL ||
          "https://dips.soton.ac.uk/negotiation-api";
        const masterPasswordParam = process.env.MASTER_PASSWORD!;

        const encodedMasterPassword = encodeURIComponent(masterPasswordParam);

        const fallback = "unknown";
        const randomPassword = "Random_Password_For_Testing_13!";

        const registrationPayload = {
          username_email: email,
          username: email.includes("@") ? email.split("@")[0] : email,
          password: randomPassword, // Ideally this should be null so we can create users who can only login through an email link.
          name: `${fallback} ${fallback}`, // The user management service takes this value and splits it into first name and last name. We should model it otherwise.
          type: "provider",
        
          incorporation: decoded_token.incorporation || fallback,
          address: decoded_token.address || fallback,
          position_title: decoded_token?.positionTitle || fallback,
          vat_no: decoded_token?.VAT_No || fallback,
          phone: decoded_token?.phone || fallback,
          organization: decoded_token?.organization || [fallback],
        };

        const apiResponse = await fetch(
          `${externalApiUrl}/user/register?master_password_input=${encodedMasterPassword}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(registrationPayload),
          }
        );

        console.log("API response status:", apiResponse.status);

        if (apiResponse.ok) {
          const successData = await apiResponse.json();
          userRecord = successData;
          console.log("User Management Service API registration successful:", successData);

          // Extract MongoDB user ID from the response
          if (successData && (successData.user_id || successData.id || successData._id)) {
            uid = successData.user_id || successData.id || successData._id;
            console.log("MongoDB user ID received:", uid);
          } else {
            console.warn("No user ID found in API response:", successData);
          }

          await db.collection("tokens").updateOne({token: {$eq: decoded_token.token}}, {$set: {used: true}}); //Mark the token as used.
          await db.collection("requests").updateOne({'_id': new ObjectId(requestId.toString())}, {$addToSet: {owners: uid, ownersPending: uid}}); //Update the request to add the new user as an owner and pending owner.
        
          const keycloak_login_response = await login(email, randomPassword);

          if (!keycloak_login_response) {
            return res.status(401).json({
              error: "Keycloak login failed",
              success: false,
            });
          }

          const access_token = keycloak_login_response.access_token;
          console.log(
            "External API login successful:",
            access_token.substring(0, 50)
          );

          const redirect_url = process.env.FRONTEND_URL || "https://dips.soton.ac.uk/consent-manager"


          const userData = {uid: userRecord._id, role: "owner", email: userRecord.username_email, ...userRecord};
          const encodedUser = encodeURIComponent(JSON.stringify(userData));
          const encodedToken = encodeURIComponent(access_token);

          req.session.userUid = uid;
          res.redirect(
            `${redirect_url}/ownerBase/ownerPendingRequestsDetails/${requestId}` +
            `?auth_user=${encodedUser}` +
            `&auth_token=${encodedToken}`
          );
          //TODO: Possibly send email to user that contains their random password, or action links.
        } else {
          const errorData = await apiResponse.json();
          console.error("External API registration failed:", {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            error: errorData,
            email: email,
            role: "owner",
            type: "provider",
          });
        }

      } catch (apiError: any) {
        console.error("External API registration exception:", {
          error: apiError.message,
          stack: apiError.stack,
          email: email,
        });
      }

      
    }
    catch(error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Registration failed",
      })
    }
  }
  catch(error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Token verification failed",
    })
  }
}
);

// GET /api/auth/token/:token - Authenticate with external API token and redirect
// TODO: Test this
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
    let keycloak_sub = null;

    try {
      // JWT has 3 parts separated by dots: header.payload.signature
      const jwtParts = actualJwtToken.split(".");
      if (jwtParts.length === 3) {
        // Decode the payload (base64)
        const payload = JSON.parse(
          Buffer.from(jwtParts[1], "base64").toString()
        );
        console.log("JWT payload:", payload);
        keycloak_sub = payload.sub; // 'sub' usually contains the email
      }
    } catch (jwtError) {
      console.error("JWT decode error:", jwtError);
      return res.status(401).json({
        error: "Invalid JWT token format",
        success: false,
      });
    }

    if (!keycloak_sub) {
      console.error("Could not extract email from JWT");
      return res.status(401).json({
        error: "Could not extract user email from token",
        success: false,
      });
    }

    console.log("Extracted email from JWT:", keycloak_sub);

    let role = "owner"; // Default fallback
    let userData = null;
    let userUid = null;
    let displayName = "Marketing Audit User";

    console.log(
      "Determined role for token auth:",
      role,
      "for email:",
      keycloak_sub
    );

    try {
      const detailsForm = new URLSearchParams({keycloak_sub: keycloak_sub});
      const userManagementServiceURL = process.env.USER_MANAGEMENT_SERVICE_API_URL || "";
      const userDetailsResponse = await fetch(
        `${userManagementServiceURL}/user/details/?${detailsForm}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${actualJwtToken}` },
        }
      );

      if (userDetailsResponse.ok) {
        const userDetails = await userDetailsResponse.json();
        userData = userDetails;
        console.log(
          "User details from external API (token auth):",
          userDetails
        );
      }
      else {
        console.warn(
          "⚠️ No MongoDB user ID found in external API user details (token auth)"
        );
      }
    } catch (userDetailsError) {
      console.warn(
        "Error fetching user details from external API during token auth:",
        userDetailsError
      );
    }

    // Create a user object that matches the React AuthUser interface exactly
    const authUser = {
      uid:
        userUid ||
        "external_user_" +
          Buffer.from(keycloak_sub).toString("base64").substr(0, 10),
      email: keycloak_sub,
      displayName: displayName,
      role: role,
      userData: userData || {
        name: displayName,
        email: keycloak_sub,
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
