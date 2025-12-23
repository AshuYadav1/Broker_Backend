import { Router } from 'express';
import * as leadController from '../controllers/lead.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin only leads
router.get('/', authenticate, requireAdmin, leadController.getLeads);

export default router;
