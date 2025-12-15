"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndRotateStorage = exports.STORAGE_LIMIT_GB = void 0;
const check_disk_space_1 = __importDefault(require("check-disk-space"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../prisma"));
exports.STORAGE_LIMIT_GB = 90; // Leave 10GB buffer
const STORAGE_PATH = path_1.default.join(__dirname, '../../public/videos');
const checkAndRotateStorage = async () => {
    try {
        const diskSpace = await (0, check_disk_space_1.default)(STORAGE_PATH);
        const freeGb = diskSpace.free / 1024 / 1024 / 1024;
        const totalGb = diskSpace.size / 1024 / 1024 / 1024;
        const usedGb = totalGb - freeGb;
        console.log(`[Storage] Check: ${usedGb.toFixed(2)}GB used / ${totalGb.toFixed(2)}GB total`);
        if (usedGb > exports.STORAGE_LIMIT_GB) {
            console.warn(`[Storage] Limit exceeded (${usedGb.toFixed(2)}GB > ${exports.STORAGE_LIMIT_GB}GB). Starting rotation...`);
            await rotateStorage();
        }
    }
    catch (error) {
        console.error('[Storage] Error checking disk space:', error);
    }
};
exports.checkAndRotateStorage = checkAndRotateStorage;
const rotateStorage = async () => {
    // 1. Find oldest videos (by createdAt)
    const oldestProperties = await prisma_1.default.property.findMany({
        orderBy: { createdAt: 'asc' },
        take: 10, // Delete 10 at a time
        select: { id: true, videoUrl: true }
    });
    for (const prop of oldestProperties) {
        // Extract filename from URL (e.g., /media/videos/timestamp-random/master.m3u8)
        // We need the folder name: 'timestamp-random'
        const parts = prop.videoUrl.split('/');
        const folderName = parts[parts.length - 2];
        if (folderName && folderName !== 'videos') {
            const folderPath = path_1.default.join(STORAGE_PATH, folderName);
            console.log(`[Storage] Deleting old video: ${folderName}`);
            try {
                if (fs_1.default.existsSync(folderPath)) {
                    fs_1.default.rmSync(folderPath, { recursive: true, force: true });
                }
                // 2. Delete from DB (or mark as archived/deleted if you prefer soft delete)
                // For now, hard delete to free DB space too (though negligible) or just unset videoUrl
                // Let's delete the property or just the video field? 
                // Context: "roate storage" implies content is transient. 
                // But deleting the Property might destroy user data (title, price).
                // BETTER: Delete the video files, keep the Property record, maybe set videoUrl to null or 'expired'.
                await prisma_1.default.property.update({
                    where: { id: prop.id },
                    data: { videoUrl: 'EXPIRED' }
                });
            }
            catch (err) {
                console.error(`[Storage] Failed to delete ${folderName}`, err);
            }
        }
    }
};
