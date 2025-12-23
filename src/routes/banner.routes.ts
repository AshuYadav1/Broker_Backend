import { Router } from 'express';
import * as bannerController from '../controllers/banner.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/', bannerController.getBanners);
router.post('/', authenticate, requireAdmin, bannerController.createBanner);
router.delete('/:id', authenticate, requireAdmin, bannerController.deleteBanner);

export default router;
