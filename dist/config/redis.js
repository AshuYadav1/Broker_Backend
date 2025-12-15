"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = exports.redisConfig = void 0;
const ioredis_1 = require("ioredis");
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
exports.redisConfig = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};
exports.redisConnection = new ioredis_1.Redis(exports.redisConfig);
