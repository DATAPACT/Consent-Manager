import express from 'express';
import admin from 'firebase-admin';
import { db, storage } from '../config/firebase.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const getFileSizeLimit = () => {
  const limit = process.env.FILE_UPLOAD_LIMIT || '10mb';
  // Convert string like "100mb" to bytes
  const match = limit.match(/^(\d+)(mb|gb|kb)?$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const value = parseInt(match[1]);
  const unit = (match[2] || 'mb').toLowerCase();
  
  switch (unit) {
    case 'gb': return value * 1024 * 1024 * 1024;
    case 'mb': return value * 1024 * 1024;
    case 'kb': return value * 1024;
    default: return value;
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: getFileSizeLimit(),
  },
  fileFilter: (req, file, cb) => {
    // Accept ontology files (common formats)
    const allowedTypes = ['.ttl', '.rdf', '.owl', '.n3', '.jsonld', '.xml', '.json'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only ontology files are allowed.'));
    }
  }
});

// POST /api/ontologies - Upload a new ontology
router.post('/', upload.single('ontologyFile'), async (req, res) => {
  try {
    const { requesterUid, ontologyName, ontologyDescription } = req.body;
    const file = req.file;

    if (!requesterUid || !ontologyName || !file) {
      res.status(400).json({
        error: 'Requester UID, ontology name, and file are required',
        success: false
      });
      return;
    }

    const timestamp = Date.now();
    const filename = `${requesterUid}_${timestamp}_${file.originalname}`;
    const storageRef = storage.bucket().file(`ontologies/${filename}`);

    await storageRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype
      }
    });
    
    const downloadURL = await storageRef.getSignedUrl({
      action: 'read',
      expires: '03-09-2030'
    }).then(urls => urls[0]);

    const ontologyId = `ontology_${requesterUid}_${timestamp}`;

    const ontologyData = {
      id: ontologyId,
      name: ontologyName,
      description: ontologyDescription || '',
      filename: file.originalname,
      storagePath: filename,
      downloadURL,
      uploadedBy: requesterUid,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      mimeType: file.mimetype
    };

    await db.collection('ontologies').doc(ontologyId).set(ontologyData);

    const requesterRef = db.collection('requesters').doc(requesterUid);
    await requesterRef.update({
      ontologyIds: admin.firestore.FieldValue.arrayUnion(ontologyId)
    });

    res.status(201).json({
      success: true,
      ontology: ontologyData,
      message: 'Ontology uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading ontology:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload ontology',
      success: false
    });
  }
});


// GET /api/ontologies/:id - Get a specific ontology
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ontologyDoc = await db.collection('ontologies').doc(id).get();

    if (!ontologyDoc.exists) {
      res.status(404).json({
        error: 'Ontology not found',
        success: false
      });
      return;
    }

    res.json({
      success: true,
      ontology: {
        id: ontologyDoc.id,
        ...ontologyDoc.data()
      }
    });

  } catch (error: any) {
    console.error('Error fetching ontology:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch ontology',
      success: false
    });
  }
});


// GET /api/ontologies - Get ontologies for a user or all
router.get('/', async (req, res) => {
  try {
    const { requesterUid } = req.query;

    if (requesterUid) {
      // Get ontologies for this user:
      // 1. Ontologies they uploaded (have uploadedBy field matching their UID)
      // 2. The default ontology (id === 'default')
      
      const userOntologiesQuery = db.collection('ontologies').where('uploadedBy', '==', requesterUid);
      const userOntologiesSnapshot = await userOntologiesQuery.get();
      
      // Get the default ontology by ID
      const defaultOntologyDoc = await db.collection('ontologies').doc('default').get();
      
      const userOntologies = userOntologiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Add default ontology if it exists
      const allAvailableOntologies = [...userOntologies];
      if (defaultOntologyDoc.exists) {
        allAvailableOntologies.push({
          id: defaultOntologyDoc.id,
          ...defaultOntologyDoc.data()
        });
      }
      
      res.json({
        success: true,
        ontologies: allAvailableOntologies
      });
    } else {
      // No user specified - return all ontologies
      const querySnapshot = await db.collection('ontologies').get();
      const ontologies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        ontologies
      });
    }

  } catch (error: any) {
    console.error('Error fetching ontologies:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch ontologies',
      success: false
    });
  }
});

// DELETE /api/ontologies/:id - Delete an ontology
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterUid } = req.body;

    const ontologyDoc = await db.collection('ontologies').doc(id).get();
    
    if (!ontologyDoc.exists) {
      res.status(404).json({
        error: 'Ontology not found',
        success: false
      });
      return;
    }

    const ontologyData = ontologyDoc.data();

    if (!ontologyData) {
      res.status(500).json({
        error: 'Ontology data is missing',
        success: false
      });
      return;
    }

    if (ontologyData.uploadedBy !== requesterUid) {
      res.status(403).json({
        error: 'Unauthorized to delete this ontology',
        success: false
      });
      return;
    }

    const storageRef = storage.bucket().file(`ontologies/${ontologyData.storagePath}`);
    await storageRef.delete();

    await db.collection('ontologies').doc(id).delete();

    const requesterRef = db.collection('requesters').doc(requesterUid);
    await requesterRef.update({
      ontologyIds: admin.firestore.FieldValue.arrayRemove(id)
    });

    res.json({
      success: true,
      message: 'Ontology deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting ontology:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete ontology',
      success: false
    });
  }
});



// GET /api/ontologies/user/:uid/count - Get ontology count for a user
router.get('/user/:uid/count', async (req, res) => {
  try {
    const { uid } = req.params;
    
    const ontologiesQuery = db.collection('ontologies')
      .where('uploadedBy', '==', uid);
    
    const querySnapshot = await ontologiesQuery.get();
    const count = querySnapshot.size;

    res.json({
      success: true,
      count
    });

  } catch (error: any) {
    console.error('Error getting ontology count:', error);
    res.status(500).json({
      error: error.message || 'Failed to get ontology count',
      success: false
    });
  }
});

export default router;