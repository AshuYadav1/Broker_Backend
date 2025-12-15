import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';

class QueueService {
    private videoQueue: Queue;

    constructor() {
        this.videoQueue = new Queue('video-transcoding', { connection: redisConfig });
    }

    async addVideoJob(data: {
        inputPath: string;
        outputDir: string;
        filename: string;
        title?: string;
        location?: string;
        propertyId?: string;
    }) {
        return this.videoQueue.add('transcode', data);
    }
}

export const queueService = new QueueService();
