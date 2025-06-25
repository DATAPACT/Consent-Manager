import express from 'express';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, getDocs, collection, query, where, deleteDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
    const allowedTypes = ['.ttl', '.rdf', '.owl', '.n3', '.jsonld'];
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
      return res.status(400).json({
        error: 'Requester UID, ontology name, and file are required',
        success: false
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${requesterUid}_${timestamp}_${file.originalname}`;
    const storageRef = ref(storage, `ontologies/${filename}`);

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Create ontology document ID
    const ontologyId = `ontology_${requesterUid}_${timestamp}`;

    // Save ontology metadata to Firestore
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

    await setDoc(doc(db, 'ontologies', ontologyId), ontologyData);

    // Add ontology ID to requester's ontology list
    const requesterRef = doc(db, 'requesters', requesterUid);
    await updateDoc(requesterRef, {
      ontologyIds: arrayUnion(ontologyId)
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
    const ontologyDoc = await getDoc(doc(db, 'ontologies', id));

    if (!ontologyDoc.exists()) {
      return res.status(404).json({
        error: 'Ontology not found',
        success: false
      });
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

    let ontologiesQuery = collection(db, 'ontologies');
    
    if (requesterUid) {
      ontologiesQuery = query(ontologiesQuery, where('uploadedBy', '==', requesterUid));
    }

    const querySnapshot = await getDocs(ontologiesQuery);
    const ontologies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      ontologies
    });

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

    // Get ontology document
    const ontologyDoc = await getDoc(doc(db, 'ontologies', id));
    
    if (!ontologyDoc.exists()) {
      return res.status(404).json({
        error: 'Ontology not found',
        success: false
      });
    }

    const ontologyData = ontologyDoc.data();

    // Check if user owns this ontology
    if (ontologyData.uploadedBy !== requesterUid) {
      return res.status(403).json({
        error: 'Unauthorized to delete this ontology',
        success: false
      });
    }

    // Delete file from Firebase Storage
    const storageRef = ref(storage, `ontologies/${ontologyData.storagePath}`);
    await deleteObject(storageRef);

    // Delete ontology document
    await deleteDoc(doc(db, 'ontologies', id));

    // Remove from requester's ontology list
    const requesterRef = doc(db, 'requesters', requesterUid);
    await updateDoc(requesterRef, {
      ontologyIds: arrayRemove(id)
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
    
    const ontologiesQuery = query(
      collection(db, 'ontologies'), 
      where('uploadedBy', '==', uid)
    );
    
    const querySnapshot = await getDocs(ontologiesQuery);
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