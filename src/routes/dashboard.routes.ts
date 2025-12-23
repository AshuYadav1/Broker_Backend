import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin only stats
router.get('/stats', authenticate, requireAdmin, dashboardController.getStats);

export default router;
