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
                '-c:v libx264', '-b:v 5000k', // 5Mbps for 1080p (HQ)
                '-r 30', // Force 30fps for consistent GOP
                '-vf', 'scale=w=if(gt(iw\\,ih)\\,-2\\,1080):h=if(gt(iw\\,ih)\\,1080\\,-2)', // Escaped commas for ffmpeg
                '-c:a aac', '-ar 44100', '-b:a 192k',
                '-g 60', '-keyint_min 60', '-sc_threshold 0', // GOP = 2s
                '-hls_time 2', '-hls_playlist_type vod',
                '-hls_segment_filename', path.join(outputDir, '1080p_%03d.ts')
            ])
            .output(path.join(outputDir, '1080p.m3u8'))
            .outputOptions([
                '-c:v libx264', '-b:v 2500k', // 2.5Mbps for 720p (Medium)
                '-r 30',
                '-vf', 'scale=w=if(gt(iw\\,ih)\\,-2\\,720):h=if(gt(iw\\,ih)\\,720\\,-2)',
                '-c:a aac', '-ar 44100', '-b:a 128k',
                '-g 60', '-keyint_min 60', '-sc_threshold 0',
                '-hls_time 2', '-hls_playlist_type vod',
                '-hls_segment_filename', path.join(outputDir, '720p_%03d.ts')
            ])
            .output(path.join(outputDir, '720p.m3u8'))
            .outputOptions([
                '-c:v libx264', '-b:v 1000k', // 1Mbps for 480p (Low/Mobile)
                '-r 30',
                '-vf', 'scale=w=if(gt(iw\\,ih)\\,-2\\,480):h=if(gt(iw\\,ih)\\,480\\,-2)',
                '-c:a aac', '-ar 44100', '-b:a 96k',
                '-g 60', '-keyint_min 60', '-sc_threshold 0',
                '-hls_time 2', '-hls_playlist_type vod',
                '-hls_segment_filename', path.join(outputDir, '480p_%03d.ts')
            ])
            .output(path.join(outputDir, '480p.m3u8'))
            .on('end', () => {
                const masterContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000
480p.m3u8`;
                fs.writeFileSync(masterPlaylistPath, masterContent);
                console.log(`[Worker] Job ${job.id} Transcoding Complete`);

                // Cleanup input file
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

                // Permission Fix: Ensure Nginx can read all generated files
                try {
                    fs.chmodSync(outputDir, 0o755);
                    const files = fs.readdirSync(outputDir);
                    files.forEach(file => {
                        fs.chmodSync(path.join(outputDir, file), 0o644);
                    });
                } catch (permErr) {
                    console.error(`[Worker] Failed to set permissions for ${filename}:`, permErr);
                }

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
