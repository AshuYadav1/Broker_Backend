import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

import { validate } from '../middleware/validate.middleware';
import { loginSchema, otpRequestSchema, otpVerifySchema, profileUpdateSchema } from '../schema/auth.schema';
import { rateLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Rate Limit: General Auth (100 req per 15 min)
const authLimiter = rateLimiter(100, 15 * 60, 'auth');

// Rate Limit: Critical SMS/OTP (5 req per 15 min per IP) - Prevents SMS Flooding/Budget Drain
const otpLimiter = rateLimiter(5, 15 * 60, 'otp_critical');

// Mobile
router.post('/mobile/send-otp', otpLimiter, validate(otpRequestSchema), authController.sendMobileOTP);
router.post('/mobile/verify-otp', authLimiter, validate(otpVerifySchema), authController.verifyMobileOTP);

// Admin
router.post('/admin/login', authLimiter, validate(loginSchema), authController.loginAdmin);
router.post('/admin/register', authLimiter, validate(loginSchema), authController.registerAdmin); // NOTE: Protect or remove in production

export default router;
