import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { redisConfig } from '../config/redis';
import { Logger } from '../utils/logger';

// Create a dedicated Redis client for Rate Limiting to avoid blocking queue operations
const redis = new Redis(redisConfig);

/**
 * Redis-based Rate Limiter Middleware
 * Uses a Fixed Window Counter algorithm.
 * 
 * @param limit Max requests allowed in the window
 * @param windowSeconds Time window in seconds
 * @param keyPrefix Unique prefix for this limiter (e.g., 'upload', 'auth')
 */
export const rateLimiter = (limit: number, windowSeconds: number, keyPrefix: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
            const key = `ratelimit:${keyPrefix}:${ip}`;

            // Increment the counter
            const currentCount = await redis.incr(key);

            // If it's the first request, set the expiry
            if (currentCount === 1) {
                await redis.expire(key, windowSeconds);
            }

            // set headers
            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount));

            if (currentCount > limit) {
                Logger.warn(`[RateLimit] Blocked ${ip} for ${keyPrefix}`);
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later.'
                });
            }

            next();
        } catch (error) {
            Logger.error('[RateLimit] Error:', error);
            // Fail open: If Redis fails, allow the request to proceed (don't block users due to infra issues)
            next();
        }
    };
};
