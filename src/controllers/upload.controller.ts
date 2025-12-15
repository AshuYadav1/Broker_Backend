import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { queueService } from '../services/queue.service';

// Directory Setup
const publicDir = path.join(__dirname, '../../public');
const videosDir = path.join(publicDir, 'videos');
const imagesDir = path.join(publicDir, 'images');
const docsDir = path.join(publicDir, 'documents');

[videosDir, imagesDir, docsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const inputPath = req.file.path;
        const extension = path.extname(req.file.originalname).toLowerCase();
        const filename = path.parse(req.file.filename).name;

        // Video Processing
        if (req.file.mimetype.startsWith('video/')) {
            const outputDir = path.join(videosDir, filename);
            const hlsUrl = `/media/videos/${filename}/master.m3u8`;

            const { title, location, propertyId } = req.body;

            console.log(`[Upload] Received video ${filename}. Queuing for transcoding...`);

            await queueService.addVideoJob({
                inputPath,
                outputDir,
                filename,
                title: title || 'New Property',
                location: location || 'Available Now',
                propertyId: propertyId || filename // Fallback to filename if no ID
            });

            res.json({
                success: true,
                url: hlsUrl,
                type: 'video',
                message: 'Video upload accepted, processing in background'
            });

        } else if (req.file.mimetype.startsWith('image/')) {
            const outputFilename = `${filename}${extension}`;
            const outputPath = path.join(imagesDir, outputFilename);

            fs.renameSync(inputPath, outputPath);

            res.json({
                success: true,
                url: `/media/images/${outputFilename}`,
                type: 'image'
            });

        } else {
            const outputFilename = `${filename}${extension}`;
            const outputPath = path.join(docsDir, outputFilename);

            fs.renameSync(inputPath, outputPath);

            res.json({
                success: true,
                url: `/media/documents/${outputFilename}`,
                type: 'document'
            });
        }

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
