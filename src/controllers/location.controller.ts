import { Request, Response } from 'express';
import prisma from '../prisma';

export const getLocations = async (req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' }
        });

        res.json({ success: true, data: locations });
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        const { name, priority } = req.body;
        const location = await prisma.location.create({
            data: { name, priority: priority ? parseInt(priority) : 0 }
        });
        res.json({ success: true, data: location });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create location' });
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.location.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true, message: 'Location deleted' });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ error: 'Failed to delete location' });
    }
};

