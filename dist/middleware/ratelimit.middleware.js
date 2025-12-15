"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
// Create a dedicated Redis client for Rate Limiting to avoid blocking queue operations
const redis = new ioredis_1.default(redis_1.redisConfig);
/**
 * Redis-based Rate Limiter Middleware
 * Uses a Fixed Window Counter algorithm.
 *
 * @param limit Max requests allowed in the window
 * @param windowSeconds Time window in seconds
 * @param keyPrefix Unique prefix for this limiter (e.g., 'upload', 'auth')
 */
const rateLimiter = (limit, windowSeconds, keyPrefix) => {
    return async (req, res, next) => {
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
                logger_1.Logger.warn(`[RateLimit] Blocked ${ip} for ${keyPrefix}`);
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later.'
                });
            }
            next();
        }
        catch (error) {
            logger_1.Logger.error('[RateLimit] Error:', error);
            // Fail open: If Redis fails, allow the request to proceed (don't block users due to infra issues)
            next();
        }
    };
};
exports.rateLimiter = rateLimiter;
