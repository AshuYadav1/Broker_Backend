"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
class QueueService {
    constructor() {
        this.videoQueue = new bullmq_1.Queue('video-transcoding', { connection: redis_1.redisConfig });
    }
    async addVideoJob(data) {
        return this.videoQueue.add('transcode', data);
    }
}
exports.queueService = new QueueService();
