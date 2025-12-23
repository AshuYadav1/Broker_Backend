import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { uploadFile } from '../controllers/upload.controller';

import { rateLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Rate Limit: 100 uploads per 10 minutes
const uploadLimiter = rateLimiter(100, 600, 'upload');

router.post('/', uploadLimiter, upload.single('file'), uploadFile);

export default router;
