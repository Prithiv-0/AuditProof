import express from 'express';
import {
    uploadData,
    updateData,
    getAllData,
    getDataById,
    verifyIntegrity,
    simulateTamper,
    generateQRCode
} from '../controllers/dataController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require token
router.use(verifyToken);

// Unified upload route
router.post('/upload', authorize('research_data', 'create'), uploadData);

// Update route (Editing)
router.put('/:id', authorize('research_data', 'update'), updateData);

// Scoped fetching
router.get('/', authorize('research_data', 'read'), getAllData);
router.get('/:id', authorize('research_data', 'read'), getDataById);

// Verification and Tampering
router.post('/:id/verify', authorize('research_data', 'verify'), verifyIntegrity);
router.post('/:id/tamper', authorize('research_data', 'verify'), simulateTamper);
router.get('/:id/qr', authorize('research_data', 'read'), generateQRCode);

export default router;
