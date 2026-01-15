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
// CRITICAL FIX: Aligned GOP settings to prevent flickering during quality switches
const processVideoJob = async (job) => {
    const { inputPath, outputDir, filename } = job.data;
    console.log(`[Worker] Starting job ${job.id}: Transcoding ${filename}`);
    const masterPlaylistPath = path_1.default.join(outputDir, 'master.m3u8');
    if (!fs_1.default.existsSync(outputDir))
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    return new Promise((resolve, reject) => {
        // Industry Standard: Strictly aligned GOP for seamless switching
        // Source: Instagram/TikTok Engineering recommendations
        const commonVideoSettings = [
            '-c:v', 'libx264',
            '-preset', 'medium', // Good balance for VOD
            '-pix_fmt', 'yuv420p', // Most compatible pixel format
            '-profile:v', 'high', // High profile for better compression/quality
            '-level', '4.2', // Level 4.2 supports 1080p60
            '-movflags', '+faststart',
            '-r', '30', // Force 30fps for consistency
            '-g', '60', // 2-second GOP (30fps * 2)
            '-keyint_min', '60', // Strict keyframe interval
            '-sc_threshold', '0', // CRITICAL: Disable scene detection to force alignment
            '-force_key_frames', 'expr:gte(t,n_forced*2)', // Explicitly force keyframes every 2s
        ];
        const commonAudioSettings = [
            '-c:a', 'aac',
            '-ar', '48000', // 48kHz standard
            '-ac', '2', // Stereo
        ];
        const commonHLSSettings = [
            '-hls_time', '2', // 2-second segments match GOP
            '-hls_playlist_type', 'vod',
            '-hls_flags', 'independent_segments', // Essential for glitch-free switching
            '-hls_segment_type', 'mpegts',
        ];
        // PORTRAIT SCALING FILTERS (9:16)
        // Uses force_original_aspect_ratio=decrease to fit within box
        // Uses pad to fill remaining space with black (prevents stretching)
        const scaleFilter = (w, h) => `scale=-2:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`;
        (0, fluent_ffmpeg_1.default)(inputPath)
            // 1080p Portrait (1080x1920) - High Quality
            .outputOptions([
            ...commonVideoSettings,
            '-b:v', '4500k', // 4.5 Mbps (Instagram rec: 4-6 Mbps)
            '-maxrate', '5000k',
            '-bufsize', '10000k',
            '-vf', scaleFilter(1080, 1920),
            ...commonAudioSettings,
            '-b:a', '192k',
            ...commonHLSSettings,
            '-hls_segment_filename', path_1.default.join(outputDir, '1080p_%03d.ts'),
        ])
            .output(path_1.default.join(outputDir, '1080p.m3u8'))
            // 720p Portrait (720x1280) - Standard Mobile
            .outputOptions([
            ...commonVideoSettings,
            '-b:v', '2500k', // 2.5 Mbps (Good compromise)
            '-maxrate', '3000k',
            '-bufsize', '6000k',
            '-vf', scaleFilter(720, 1280),
            ...commonAudioSettings,
            '-b:a', '128k',
            ...commonHLSSettings,
            '-hls_segment_filename', path_1.default.join(outputDir, '720p_%03d.ts'),
        ])
            .output(path_1.default.join(outputDir, '720p.m3u8'))
            // 480p Portrait (480x854) - Data Saver / Poor Connection
            .outputOptions([
            ...commonVideoSettings,
            '-b:v', '1000k', // 1 Mbps (TikTok data saver range)
            '-maxrate', '1200k',
            '-bufsize', '2000k',
            '-vf', scaleFilter(480, 854),
            ...commonAudioSettings,
            '-b:a', '96k',
            ...commonHLSSettings,
            '-hls_segment_filename', path_1.default.join(outputDir, '480p_%03d.ts'),
        ])
            .output(path_1.default.join(outputDir, '480p.m3u8'))
            .on('end', () => {
            // Master Playlist with correct metadata
            const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=2750000,RESOLUTION=720x1280,FRAME-RATE=30.000,CODECS="avc1.640028,mp4a.40.2"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5500000,RESOLUTION=1080x1920,FRAME-RATE=30.000,CODECS="avc1.640029,mp4a.40.2"
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1100000,RESOLUTION=480x854,FRAME-RATE=30.000,CODECS="avc1.64001f,mp4a.40.2"
480p.m3u8`;
            fs_1.default.writeFileSync(masterPlaylistPath, masterContent);
            console.log(`[Worker] Job ${job.id} Complete`);
            // Cleanup
            if (fs_1.default.existsSync(inputPath))
                fs_1.default.unlinkSync(inputPath);
            try {
                fs_1.default.chmodSync(outputDir, 0o755);
                const files = fs_1.default.readdirSync(outputDir);
                files.forEach(file => {
                    fs_1.default.chmodSync(path_1.default.join(outputDir, file), 0o644);
                });
            }
            catch (permErr) {
                console.error(`[Worker] Permission error:`, permErr);
            }
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
    if (job.data.propertyId) {
        await notification_service_1.NotificationService.sendNewPropertyNotification({
            id: job.data.propertyId,
            title: job.data.title || 'New Property Added',
            location: job.data.location || 'Prime Location',
            imageUrl: `https://video.royalkey.in/media/images/${job.data.filename}.jpg`
        });
    }
});
worker.on('failed', (job, err) => {
    console.log(`[Queue] Job ${job?.id} has failed with ${err.message}`);
});
console.log('🚀 Worker Server Started. Listening for jobs...');
