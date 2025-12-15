"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const queue_service_1 = require("../services/queue.service");
// Directory Setup
const publicDir = path_1.default.join(__dirname, '../../public');
const videosDir = path_1.default.join(publicDir, 'videos');
const imagesDir = path_1.default.join(publicDir, 'images');
const docsDir = path_1.default.join(publicDir, 'documents');
[videosDir, imagesDir, docsDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
});
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const inputPath = req.file.path;
        const extension = path_1.default.extname(req.file.originalname).toLowerCase();
        const filename = path_1.default.parse(req.file.filename).name;
        // Video Processing
        if (req.file.mimetype.startsWith('video/')) {
            const outputDir = path_1.default.join(videosDir, filename);
            const hlsUrl = `/media/videos/${filename}/master.m3u8`;
            const { title, location, propertyId } = req.body;
            console.log(`[Upload] Received video ${filename}. Queuing for transcoding...`);
            await queue_service_1.queueService.addVideoJob({
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
        }
        else if (req.file.mimetype.startsWith('image/')) {
            const outputFilename = `${filename}${extension}`;
            const outputPath = path_1.default.join(imagesDir, outputFilename);
            fs_1.default.renameSync(inputPath, outputPath);
            res.json({
                success: true,
                url: `/media/images/${outputFilename}`,
                type: 'image'
            });
        }
        else {
            const outputFilename = `${filename}${extension}`;
            const outputPath = path_1.default.join(docsDir, outputFilename);
            fs_1.default.renameSync(inputPath, outputPath);
            res.json({
                success: true,
                url: `/media/documents/${outputFilename}`,
                type: 'document'
            });
        }
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.uploadFile = uploadFile;
