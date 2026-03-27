import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { protect } from '../middleware/auth.js';
import {
  submitApplication,
  submitApplicationsFromRows,
  getHistory,
  getApplicationById,
  getBiasReport,
  getStats
} from '../controllers/creditController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function parseUploadedFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV or XLSX file' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    req.parsedRows = rows;
    return next();
  } catch (error) {
    return res.status(400).json({ error: 'Could not parse uploaded file', details: error.message });
  }
}

router.use(protect);
router.post('/apply', submitApplication);
router.post('/apply-upload', upload.single('file'), parseUploadedFile, submitApplicationsFromRows);
router.get('/history', getHistory);
router.get('/stats', getStats);
router.get('/bias-report', getBiasReport);
router.get('/:id', getApplicationById);

export default router;  