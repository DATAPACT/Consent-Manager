import express from "express";

const router = express.Router();

// Get external API base URL from environment variable or use production default
const EXTERNAL_API_BASE_URL =
  process.env.EXTERNAL_API_BASE_URL || "https://dips.soton.ac.uk/user-management";

// GET /api/external/users - Proxy to external API for user list
router.get("/users", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    const response = await fetch(`${EXTERNAL_API_BASE_URL}/users_list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const users = await response.json();

    res.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error("Error fetching external users:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch users from external API",
      success: false,
    });
  }
});

// GET /api/external/user-details - Proxy to external API for user details
router.get("/user-details", async (req, res) => {
  try {
    const { user_id } = req.query;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required",
        success: false,
      });
    }

    const url = user_id
      ? `${EXTERNAL_API_BASE_URL}/user/details/?user_id=${user_id}`
      : `${EXTERNAL_API_BASE_URL}/user/details/`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const userDetails = await response.json();

    res.json({
      success: true,
      user: userDetails,
    });
  } catch (error: any) {
    console.error("Error fetching external user details:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch user details from external API",
      success: false,
    });
  }
});

export default router;
