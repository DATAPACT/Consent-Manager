import express from "express";
import { Resend } from "resend";
import admin, { db } from "../config/firebase.js";
import "express-session";

const router = express.Router();
const resend = new Resend();

// GET /api/auth/owners - Get all owners
router.get("/email/:uid", async (req, res) => {
  try {
    // const ownersSnapshot = await db.collection("owners").get();
    // const owners: { id: string; email: string; name?: string }[] = [];

    // ownersSnapshot.forEach((doc) => {
    //   const data = doc.data();
    //   if (data.email) {
    //     owners.push({
    //       id: doc.id,
    //       email: data.email,
    //       name: data.name || "Unknown",
    //     });
    //   }
    // });

    // const userIds = req.body.userIds || [];
    // const email = req.body.email || "";
    // const password = req.body.password || "";

    // await resend.emails.send({
    //   from: 'dips-consent-manager@soton.ac.uk',
    //   to: email,
    //   subject: 'Consent Request',
    // });

    // res.json({
    //   success: true,
    //   owners,
    // });
    var actionCodeSettings = {
      url: 'localhost:5173/consent-manager',
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.example.ios'
      },
      android: {
        packageName: 'com.example.android',
        installApp: true,
        minimumVersion: '12'
      },
    };
    admin.auth().generateSignInWithEmailLink(req.body.email, actionCodeSettings);
    const {data, error} = await resend.emails.send({
      from: 'DIPS Consent Manager <dips-consent-manager@soton.ac.uk>',
      to: req.body.email,
      subject: 'Consent Request',
      html: '<p>Please click the link to consent:</p><p><a href="LINK">Consent</a></p><p>Or click the following link to reject:</p><p><a href="LINK">Reject</a></p>',
    });

    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({
        error: error.message || "Failed to send email",
        success: false,
      });
    }

    res.status(200).json({ data });

  } catch (error: any) {
    console.error("Get all owners error:", error);
    res.status(500).json({
      error: error.message || "Failed to get owners",
      success: false,
    });
  }
});

export default router