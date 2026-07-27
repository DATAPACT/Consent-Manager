import express from 'express';
import multer from 'multer';
import { db } from "../config/database.service.ts";
import * as rdf from "rdflib";
import { ObjectId } from 'mongodb';

const router = express.Router();

// Configure multer for file uploads
const getFileSizeLimit = () => {
  const limit = process.env.FILE_UPLOAD_LIMIT || '10mb';
  // Convert string like "100mb" to bytes
  console.log("File limit is: ",limit);
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

const extensionToMimetype = (extension: string | undefined) => {
  if (extension === ".ttl") {
    return "text/turtle";
  }
  else if (extension === ".rdf" || extension === ".owl" || extension === ".xml") {
    return "application/rdf+xml";
  }
  else if (extension === ".n3") {
    return "text/n3";
  }
  else if (extension === ".jsonld") {
    return "application/ld+json";
  }
  else if (extension === ".json") {
    return "application/rdf+json";
  }
  else {
    return "text/turtle";
  }
}

// POST /api/ontologies - Upload a new ontology
router.post('/', upload.single('ontologyFile'), async (req, res) => {
  try {
    const { requesterUid, ontologyName, ontologyDescription } = req.body;
    const file = req.file;
    const fileExtension = file?.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    const fileContent = req.file?.buffer.toString();
    const fileContentMimetype = extensionToMimetype(fileExtension);

    const graph = rdf.graph();

    if (fileContent) {
      rdf.parse(fileContent, graph, "http://example.org/", fileContentMimetype);
    }
    else{
      console.error("Could not parse ontology.");
      res.status(500).json({
        error: 'Failed to upload ontology',
        success: false
      });
      return;
    }
    const graphContent = rdf.serialize(rdf.sym("http://example.org/"), graph, "http://example.org/", 'application/ld+json', undefined, {flags: 'o'} );
    const content = graphContent !== undefined ? JSON.parse(graphContent) : {};

    if (!requesterUid || !ontologyName || !file) {
      res.status(400).json({
        error: 'Requester UID, ontology name, and file are required',
        success: false
      });
      return;
    }

    const ontologyId = new ObjectId();

    const ontologyData = {
      _id: ontologyId,
      name: ontologyName,
      description: ontologyDescription || '',
      content: content,
      filename: file.originalname,
      uploadedBy: requesterUid,
      uploadedAt: new Date().toISOString(),
    };

    await db.collection('ontologies').insertOne(ontologyData);

    //@ts-ignore
    await db.collection('users').updateOne({_id: new ObjectId(requesterUid)}, {$push: {ontologyIds: ontologyId}});

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
    const ontologyDoc = await db.collection('ontologies').findOne({'_id': {$eq: new ObjectId(id)}});

    if (!ontologyDoc) {
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
      
      const userOntologiesQuery = db.collection('ontologies').find({'uploadedBy': {$eq: requesterUid}});
      
      // Get the default ontology by ID
      const defaultOntologyDoc = await db.collection('ontologies').findOne({'default': {$eq: true}});
      
      const userOntologies = await userOntologiesQuery.toArray();
      
      // Add default ontology if it exists
      const allAvailableOntologies = [...userOntologies];
      if (defaultOntologyDoc) {
        allAvailableOntologies.push(defaultOntologyDoc);
      }

      allAvailableOntologies.forEach(async value => {
        console.log(value);
      }
      )
      
      res.json({
        success: true,
        ontologies: allAvailableOntologies
      });
    } else {
      // No user specified - return all ontologies
      const ontologies = await db.collection('ontologies').find().toArray();

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

    const ontologyDoc = await db.collection('ontologies').findOne({'_id': {$eq: new ObjectId(id)}});
    
    if (!ontologyDoc) {
      res.status(404).json({
        error: 'Ontology not found',
        success: false
      });
      return;
    }

    if (ontologyDoc.uploadedBy !== requesterUid) {
      res.status(403).json({
        error: 'Unauthorized to delete this ontology',
        success: false
      });
      return;
    }

    const deleteResult = await db.collection('ontologies').deleteOne({'_id': {$eq: new ObjectId(id)}});

    if (!deleteResult) {
      console.error('Error deleting ontology');
      res.status(500).json({
        error: 'Failed to delete ontology',
        success: false
      });
      return;
    }

    //@ts-ignore
    const requesterRef = await db.collection('users').findOneAndUpdate({_id: new ObjectId(requesterUid)}, {$pull: {ontologyIds: new ObjectId(id)}});

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
      .find({'uploadedBy': {$eq: uid}});
    
    const querySnapshot = await ontologiesQuery.toArray();
    const count = querySnapshot.length;

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
