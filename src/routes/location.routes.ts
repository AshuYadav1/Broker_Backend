import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', locationController.getLocations); // Public
router.post('/', authenticate, requireAdmin, locationController.createLocation);
router.delete('/:id', authenticate, requireAdmin, locationController.deleteLocation);

export default router;
