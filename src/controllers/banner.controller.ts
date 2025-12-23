import { Request, Response } from 'express';
import prisma from '../prisma';

export const getBanners = async (req: Request, res: Response) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createBanner = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, imageUrl, category } = req.body;
        const banner = await prisma.banner.create({
            data: { title, subtitle, imageUrl, category, active: true }
        });
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
};

export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.banner.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
};
