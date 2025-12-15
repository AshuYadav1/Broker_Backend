import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

import { validate } from '../middleware/validate.middleware';
import { loginSchema, otpRequestSchema, otpVerifySchema } from '../schema/auth.schema';
import { rateLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Rate Limit: 5 requests per 1 minute
const authLimiter = rateLimiter(5, 60, 'auth');

// Mobile
router.post('/mobile/send-otp', authLimiter, validate(otpRequestSchema), authController.sendMobileOTP);
router.post('/mobile/verify-otp', authLimiter, validate(otpVerifySchema), authController.verifyMobileOTP);

// Admin
router.post('/admin/login', authLimiter, validate(loginSchema), authController.loginAdmin);
router.post('/admin/register', authLimiter, validate(loginSchema), authController.registerAdmin); // NOTE: Protect or remove in production

export default router;
