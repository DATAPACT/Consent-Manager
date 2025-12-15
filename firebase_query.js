// We'll run this from the upconsent directory where firebase-admin is available
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Path to service account from our current location
const serviceAccountPath = path.join(__dirname, '../upconsent/firebase-admin-key.json');

console.log('Reading service account from:', serviceAccountPath);

try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "upconsent"
    });
    
    console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
}

const db = admin.firestore();

async function queryRequests() {
    try {
        console.log("\n🔍 Querying Firebase for requests...");
        
        const requestsSnapshot = await db.collection("requests").limit(10).get();
        
        if (requestsSnapshot.empty) {
            console.log("📭 No requests found in Firebase");
            return;
        }
        
        console.log(`\n📊 Found ${requestsSnapshot.size} requests`);
        console.log("=".repeat(80));
        
        requestsSnapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n📄 Request ${index + 1} (ID: ${doc.id}):`);
            console.log(`   Request Name: ${data.requestName || "N/A"}`);
            console.log(`   Status: ${data.status || "N/A"}`);
            console.log(`   Created At: ${data.createdAt || "N/A"}`);
            console.log(`   Sent At: ${data.sentAt || "N/A"}`);
            
            // Check for policy-related fields
            if (data.policy) {
                console.log("\n🔍 FOUND POLICY FIELD!");
                console.log(`   Policy type: ${typeof data.policy}`);
                
                if (typeof data.policy === 'object' && data.policy !== null) {
                    const policyKeys = Object.keys(data.policy);
                    console.log(`   Policy keys: ${policyKeys.join(', ')}`);
                    
                    if (data.policy['@context']) {
                        console.log("   ✅ ODRL Policy detected (@context found)");
                        console.log(`   @context: ${JSON.stringify(data.policy['@context']).substring(0, 100)}...`);
                    }
                    
                    if (data.policy['@id']) {
                        console.log(`   Policy ID: ${data.policy['@id']}`);
                    }
                    
                    if (data.policy['odrl:permission']) {
                        const permissions = data.policy['odrl:permission'];
                        console.log(`   ✅ ODRL Permissions found (${permissions.length} permissions)`);
                        
                        // Show details of first permission
                        if (permissions.length > 0) {
                            const firstPerm = permissions[0];
                            console.log(`   First permission details:`);
                            
                            if (firstPerm['odrl:action']) {
                                const action = firstPerm['odrl:action']['rdf:value']?['@id'] || 'N/A';
                                console.log(`     Action: ${action}`);
                            }
                            
                            if (firstPerm['odrl:target']) {
                                const target = firstPerm['odrl:target']['odrl:source']?['@id'] || 'N/A';
                                console.log(`     Target: ${target}`);
                            }
                            
                            if (firstPerm['odrl:assignee']) {
                                const assignee = firstPerm['odrl:assignee']['odrl:source']?['@id'] || 'N/A';
                                console.log(`     Assignee: ${assignee}`);
                                
                                if (firstPerm['odrl:assignee']['odrl:refinement']) {
                                    const refinement = firstPerm['odrl:assignee']['odrl:refinement'];
                                    if (refinement['odrl:rightOperand']) {
                                        console.log(`     Authorized managers: ${JSON.stringify(refinement['odrl:rightOperand'])}`);
                                    }
                                }
                            }
                            
                            if (firstPerm['odrl:constraint']) {
                                console.log(`     Constraints: ${firstPerm['odrl:constraint'].length} items`);
                                firstPerm['odrl:constraint'].forEach((constraint, i) => {
                                    const leftOp = constraint['odrl:leftOperand']?['@id'] || 'N/A';
                                    const operator = constraint['odrl:operator']?['@id'] || 'N/A';
                                    console.log(`       ${i+1}. ${leftOp} ${operator} ...`);
                                });
                            }
                        }
                    }
                } else {
                    console.log(`   Policy value: ${JSON.stringify(data.policy).substring(0, 200)}...`);
                }
            } else {
                console.log("   ❌ No policy field found");
            }
            
            // Check permissions structure
            if (data.permissions && Array.isArray(data.permissions)) {
                console.log(`\n📋 Permissions array found (${data.permissions.length} items)`);
                
                data.permissions.forEach((perm, permIndex) => {
                    console.log(`   Permission ${permIndex + 1}:`);
                    console.log(`     Dataset: ${perm.dataset || "N/A"}`);
                    console.log(`     Dataset Refinements: ${perm.datasetRefinements?.length || 0} items`);
                    console.log(`     Purpose Refinements: ${perm.purposeRefinements?.length || 0} items`);
                    console.log(`     Action Refinements: ${perm.actionRefinements?.length || 0} items`);
                    console.log(`     Constraint Refinements: ${perm.constraintRefinements?.length || 0} items`);
                    
                    // Show refinement details if any
                    if (perm.datasetRefinements && perm.datasetRefinements.length > 0) {
                        console.log(`     Dataset refinement example: ${JSON.stringify(perm.datasetRefinements[0])}`);
                    }
                });
            } else {
                console.log("   ❌ No permissions array found");
            }
            
            // Check for metadata
            if (data.metadata) {
                console.log(`\n📊 Metadata found:`);
                console.log(`   Type: ${typeof data.metadata}`);
                
                if (typeof data.metadata === 'object') {
                    Object.keys(data.metadata).forEach(key => {
                        console.log(`   ${key}: ${JSON.stringify(data.metadata[key])}`);
                    });
                }
            }
            
            // Check for requester info
            if (data.requester) {
                console.log(`\n👤 Requester: ${data.requester.requesterName} (${data.requester.requesterEmail})`);
                console.log(`   Requester ID: ${data.requester.requesterId}`);
            }
            
            // Check for ontologies
            if (data.selectedOntologies) {
                console.log(`\n🧠 Selected Ontologies: ${data.selectedOntologies.length} items`);
                data.selectedOntologies.forEach(onto => {
                    console.log(`   - ${onto.name} (ID: ${onto.id})`);
                });
            }
            
            // Check for any field containing "policy"
            const policyRelatedFields = Object.keys(data).filter(key => 
                key.toLowerCase().includes('policy')
            );
            if (policyRelatedFields.length > 0) {
                console.log(`\n🔍 Policy-related fields: ${policyRelatedFields.join(', ')}`);
            }
            
            console.log(`\n📝 All top-level fields: ${Object.keys(data).join(', ')}`);
            console.log("-".repeat(80));
        });
        
        console.log(`\n✅ Analysis complete. Found ${requestsSnapshot.size} requests.`);
        
    } catch (error) {
        console.error("❌ Error fetching requests:", error);
    }
    
    process.exit(0);
}

console.log('\n🚀 Starting Firebase query...');
queryRequests();