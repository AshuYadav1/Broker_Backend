"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = require("./config/redis");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const VIDEO_QUEUE_NAME = 'video-transcoding';
// This function performs the heavy CPU task
const processVideoJob = async (job) => {
    const { inputPath, outputDir, filename } = job.data;
    console.log(`[Worker] Starting job ${job.id}: Transcoding ${filename}`);
    const masterPlaylistPath = path_1.default.join(outputDir, 'master.m3u8');
    // Ensure output directory exists (in case worker is on same machine for now)
    if (!fs_1.default.existsSync(outputDir))
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions([
            '-c:v:0 libx264', '-b:v:0 2800k', '-s:v:0 1280x720',
            '-c:a:0 aac', '-ar 44100', '-b:a:0 128k', // Consistent Audio
            '-g 120', '-keyint_min 120', '-sc_threshold 0', // GOP Alignment (4s @ 30fps)
            '-hls_time 4', '-hls_playlist_type vod',
            '-hls_segment_filename', path_1.default.join(outputDir, '720p_%03d.ts')
        ])
            .output(path_1.default.join(outputDir, '720p.m3u8'))
            .outputOptions([
            '-c:v:0 libx264', '-b:v:0 1400k', '-s:v:0 854x480',
            '-c:a:0 aac', '-ar 44100', '-b:a:0 128k',
            '-g 120', '-keyint_min 120', '-sc_threshold 0',
            '-hls_time 4', '-hls_playlist_type vod',
            '-hls_segment_filename', path_1.default.join(outputDir, '480p_%03d.ts')
        ])
            .output(path_1.default.join(outputDir, '480p.m3u8'))
            .on('end', () => {
            const masterContent = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480\n480p.m3u8`;
            fs_1.default.writeFileSync(masterPlaylistPath, masterContent);
            // Cleanup input file
            if (fs_1.default.existsSync(inputPath))
                fs_1.default.unlinkSync(inputPath);
            console.log(`[Worker] Job ${job.id} Complete: ${filename}`);
            resolve(true);
        })
            .on('error', (err) => {
            console.error(`[Worker] Job ${job.id} Failed:`, err);
            if (fs_1.default.existsSync(inputPath))
                fs_1.default.unlinkSync(inputPath);
            reject(err);
        })
            .run();
    });
};
const worker = new bullmq_1.Worker(VIDEO_QUEUE_NAME, processVideoJob, {
    connection: redis_1.redisConfig,
    concurrency: 2 // Process 2 videos at a time per worker instance
});
const notification_service_1 = require("./services/notification.service");
worker.on('completed', async (job) => {
    console.log(`[Queue] Job ${job.id} has completed!`);
    // In a real scenario, we would fetch the Property details from DB using the filename/ID
    // For now, checks if job.data has property details (we will add this next)
    if (job.data.propertyId) {
        await notification_service_1.NotificationService.sendNewPropertyNotification({
            id: job.data.propertyId,
            title: job.data.title || 'New Property Added',
            location: job.data.location || 'Prime Location',
            imageUrl: `https://video.royalkey.in/media/images/${job.data.filename}.jpg` // Assumption
        });
    }
});
worker.on('failed', (job, err) => {
    console.log(`[Queue] Job ${job?.id} has failed with ${err.message}`);
});
console.log('🚀 Worker Server Started. Listening for jobs...');
