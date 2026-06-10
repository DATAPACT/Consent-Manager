import express from "express";
import { Resend } from "resend";
import "express-session";
import { db } from "../../src/services/database.service";
import { sendTestEmail } from "../config/nodemailer";
import { ObjectId } from "mongodb";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const dev_mode = process.env.USE_EMULATOR || true;

// GET /api/email/:uid
router.get("/email/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const ownersSnapshot = await db.collection("users").findOne({_id: {$eq: new ObjectId(uid)}});
    
    if (!ownersSnapshot) {
      console.error("User not found");
      return res.status(404).json({
        error: "User not found",
        success: false,
      });
    }

    const email_content = {
      from: 'DIPS Consent Manager <dips-consent-manager@soton.ac.uk>',
      to: ownersSnapshot.username_email,
      subject: 'Consent Request',
      html: '<p>Please click the link to consent:</p><p><a href="LINK">Consent</a></p><p>Or click the following link to reject:</p><p><a href="LINK">Reject</a></p>',
    }

    if (dev_mode){
      const result = await sendTestEmail(email_content);

      if (result.success) {
        console.log("Email sent successfully. Preview URL: ",result.url);
      }
      else{
        console.error("Error sending email");
        return res.status(500).json({
          error: "Failed to send email",
          success: false,
        });
      }
    }

    else{
      const {data, error} = await resend.emails.send(email_content);

      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({
          error: error.message || "Failed to send email",
          success: false,
        });
      }

      return res.status(200).json({ data });
    }

  } catch (error: any) {
    console.error("Get all owners error:", error);
    res.status(500).json({
      error: error.message || "Failed to get owners",
      success: false,
    });
  }
});

router.post("email/:uid/")

export default router