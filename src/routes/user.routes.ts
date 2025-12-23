import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

import { profileUpdateSchema } from '../schema/auth.schema';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Admin only users
router.get('/', authenticate, requireAdmin, userController.getUsers);

// User profile
router.put('/profile', authenticate, validate(profileUpdateSchema), userController.updateProfile);

export default router;
