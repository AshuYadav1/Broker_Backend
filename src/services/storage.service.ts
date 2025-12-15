import checkDiskSpace from 'check-disk-space';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';

export const STORAGE_LIMIT_GB = 95; // Leave 5GB buffer
const STORAGE_PATH = path.join(__dirname, '../../public/videos');

export const checkAndRotateStorage = async () => {
    try {
        const diskSpace = await checkDiskSpace(STORAGE_PATH);
        const freeGb = diskSpace.free / 1024 / 1024 / 1024;
        const totalGb = diskSpace.size / 1024 / 1024 / 1024;
        const usedGb = totalGb - freeGb;

        console.log(`[Storage] Check: ${usedGb.toFixed(2)}GB used / ${totalGb.toFixed(2)}GB total`);

        if (usedGb > STORAGE_LIMIT_GB) {
            console.warn(`[Storage] Limit exceeded (${usedGb.toFixed(2)}GB > ${STORAGE_LIMIT_GB}GB). Starting rotation...`);
            await rotateStorage();
        }
    } catch (error) {
        console.error('[Storage] Error checking disk space:', error);
    }
};

const rotateStorage = async () => {
    // 1. Find oldest videos (by createdAt)
    const oldestProperties = await prisma.property.findMany({
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
            const folderPath = path.join(STORAGE_PATH, folderName);

            console.log(`[Storage] Deleting old video: ${folderName}`);

            try {
                if (fs.existsSync(folderPath)) {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                }

                // 2. Delete from DB (or mark as archived/deleted if you prefer soft delete)
                // For now, hard delete to free DB space too (though negligible) or just unset videoUrl
                // Let's delete the property or just the video field? 
                // Context: "roate storage" implies content is transient. 
                // But deleting the Property might destroy user data (title, price).
                // BETTER: Delete the video files, keep the Property record, maybe set videoUrl to null or 'expired'.

                await prisma.property.update({
                    where: { id: prop.id },
                    data: { videoUrl: 'EXPIRED' }
                });

            } catch (err) {
                console.error(`[Storage] Failed to delete ${folderName}`, err);
            }
        }
    }
};
