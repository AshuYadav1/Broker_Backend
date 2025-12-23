import { Worker, Job } from 'bullmq';
import { redisConfig } from './config/redis';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

const VIDEO_QUEUE_NAME = 'video-transcoding';

// This function performs the heavy CPU task
const processVideoJob = async (job: Job) => {
    const { inputPath, outputDir, filename } = job.data;
    console.log(`[Worker] Starting job ${job.id}: Transcoding ${filename}`);

    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');

    // Ensure output directory exists (in case worker is on same machine for now)
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v:0 libx264', '-b:v:0 2800k', '-s:v:0 1280x720',
                '-c:a:0 aac', '-ar 44100', '-b:a:0 128k', // Consistent Audio
                '-g 120', '-keyint_min 120', '-sc_threshold 0', // GOP Alignment (4s @ 30fps)
                '-hls_time 4', '-hls_playlist_type vod',
                '-hls_segment_filename', path.join(outputDir, '720p_%03d.ts')
            ])
            .output(path.join(outputDir, '720p.m3u8'))
            .outputOptions([
                '-c:v:0 libx264', '-b:v:0 1400k', '-s:v:0 854x480',
                '-c:a:0 aac', '-ar 44100', '-b:a:0 128k',
                '-g 120', '-keyint_min 120', '-sc_threshold 0',
                '-hls_time 4', '-hls_playlist_type vod',
                '-hls_segment_filename', path.join(outputDir, '480p_%03d.ts')
            ])
            .output(path.join(outputDir, '480p.m3u8'))
            .on('end', () => {
                const masterContent = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480\n480p.m3u8`;
                fs.writeFileSync(masterPlaylistPath, masterContent);

                // Cleanup input file
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

                console.log(`[Worker] Job ${job.id} Complete: ${filename}`);
                resolve(true);
            })
            .on('error', (err) => {
                console.error(`[Worker] Job ${job.id} Failed:`, err);
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                reject(err);
            })
            .run();
    });
};

const worker = new Worker(VIDEO_QUEUE_NAME, processVideoJob, {
    connection: redisConfig,
    concurrency: 2 // Process 2 videos at a time per worker instance
});

import { NotificationService } from './services/notification.service';

worker.on('completed', async (job) => {
    console.log(`[Queue] Job ${job.id} has completed!`);

    // In a real scenario, we would fetch the Property details from DB using the filename/ID
    // For now, checks if job.data has property details (we will add this next)
    if (job.data.propertyId) {
        await NotificationService.sendNewPropertyNotification({
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
