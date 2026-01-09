import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
try {
  // Load service account key from file
  const serviceAccountPath = join(__dirname, 'firebase-admin-key.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "upconsent",
  });
  
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
  process.exit(1);
}

const db = admin.firestore();

async function checkRequests() {
  try {
    console.log("Fetching all requests from Firebase...");
    
    const requestsSnapshot = await db.collection("requests").get();
    
    if (requestsSnapshot.empty) {
      console.log("No requests found in Firebase");
      return;
    }
    
    console.log(`Found ${requestsSnapshot.size} requests`);
    console.log("=".repeat(50));
    
    requestsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nRequest ${index + 1} (ID: ${doc.id}):`);
      console.log("Request Name:", data.requestName || "N/A");
      console.log("Status:", data.status || "N/A");
      console.log("Created At:", data.createdAt || "N/A");
      console.log("Sent At:", data.sentAt || "N/A");
      
      // Check for policy-related fields
      if (data.policy || data.policyId || data.policy_id) {
        console.log("🔍 FOUND POLICY FIELD!");
        console.log("Policy data:", JSON.stringify(data.policy || data.policyId || data.policy_id, null, 2));
      }
      
      // Check permissions structure
      if (data.permissions && Array.isArray(data.permissions)) {
        console.log(`Permissions count: ${data.permissions.length}`);
        data.permissions.forEach((perm, permIndex) => {
          console.log(`  Permission ${permIndex + 1}:`);
          console.log(`    Dataset: ${perm.dataset || "N/A"}`);
          console.log(`    Dataset Refinements: ${perm.datasetRefinements?.length || 0}`);
          console.log(`    Purpose Refinements: ${perm.purposeRefinements?.length || 0}`);
          console.log(`    Action Refinements: ${perm.actionRefinements?.length || 0}`);
          console.log(`    Constraint Refinements: ${perm.constraintRefinements?.length || 0}`);
        });
      }
      
      // Check for any field containing "policy"
      Object.keys(data).forEach(key => {
        if (key.toLowerCase().includes('policy')) {
          console.log(`🔍 Policy-related field found: ${key} =`, data[key]);
        }
      });
      
      // Check for ODRL or JSON policy attachments
      if (data.attachments || data.documents || data.files) {
        console.log("📎 Attachments found:", data.attachments || data.documents || data.files);
      }
      
      console.log("Raw data keys:", Object.keys(data));
      console.log("-".repeat(30));
    });
    
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

// Run the check
checkRequests().then(() => {
  console.log("\nDone checking Firebase requests");
  process.exit(0);
}).catch(error => {
  console.error("Script error:", error);
  process.exit(1);
});