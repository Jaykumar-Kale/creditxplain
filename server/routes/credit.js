import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  submitApplication, getHistory, getApplicationById,
  getBiasReport, getStats
} from '../controllers/creditController.js';

const router = express.Router();
router.use(protect);
router.post('/apply', submitApplication);
router.get('/history', getHistory);
router.get('/stats', getStats);
router.get('/bias-report', getBiasReport);
router.get('/:id', getApplicationById);

export default router;  