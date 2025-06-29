import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { 
  uploadBill, 
  processBill, 
  getBillReceipt,
  getUserBills
} from '../controllers/billController';
import { protect } from '../middleware/auth';

const router = Router();

// Protected routes (require authentication)
router.use(protect);

// Upload and process a bill
router.post('/upload', 
  (req: Request, res: Response, next: NextFunction) => {
    uploadBill(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'Error uploading file' 
        });
      }
      next();
    });
  },
  processBill as RequestHandler
);

// Get all bills for the authenticated user
router.get('/', getUserBills as RequestHandler);

// Get bill receipt
router.get('/receipt/:filename', getBillReceipt as RequestHandler);

export default router;
