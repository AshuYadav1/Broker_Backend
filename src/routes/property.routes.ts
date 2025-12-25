import { Router } from 'express';
import * as propertyController from '../controllers/property.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

import { validate } from '../middleware/validate.middleware';
import { createPropertySchema } from '../schema/property.schema';

import { rateLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Rate Limit: 100 requests per 1 minute for public feeds
const publicLimiter = rateLimiter(100, 60, 'property');

// Public
router.get('/', publicLimiter, propertyController.getProperties);
router.get('/:id', publicLimiter, propertyController.getProperty);

// User Protected
router.post('/interactions', authenticate, propertyController.recordInteraction);
router.post('/:id/favorite', authenticate, propertyController.toggleFavorite);

// Public Settings
router.get('/settings/:key', propertyController.getSetting);

// Admin Protected
router.post('/', requireAdmin, validate(createPropertySchema), propertyController.createProperty);
router.put('/:id', requireAdmin, propertyController.updateProperty);
router.delete('/:id', requireAdmin, propertyController.deleteProperty);

export default router;
