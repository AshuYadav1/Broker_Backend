import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper for pagination/filtering
export const getProperties = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const { type, city } = req.query;

        const where: any = {};
        if (type) where.type = type;
        if (city) where.city = city;

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.property.count({ where })
        ]);

        res.json({
            success: true,
            data: properties,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({ where: { id } });

        if (!property) {
            res.status(404).json({ error: 'Property not found' });
            return;
        }

        res.json({ success: true, data: property });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createProperty = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        // Basic validation could go here

        const property = await prisma.property.create({
            data: {
                ...data,
                // Ensure array fields are arrays of strings 
                // in case they come in differently, though Prisma handles types strictly
            }
        });

        res.json({ success: true, data: property });
    } catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ error: 'Failed to create property' });
    }
};

export const updateProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const property = await prisma.property.update({
            where: { id },
            data
        });

        res.json({ success: true, data: property });
    } catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
};

export const deleteProperty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.property.delete({ where: { id } });
        res.json({ success: true, message: 'Property deleted' });
    } catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params; // Property ID

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Check if already favorited
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { favorites: { where: { id } } }
        });

        const isFavorited = user?.favorites.length ? user.favorites.length > 0 : false;

        if (isFavorited) {
            // Unfavorite
            await prisma.user.update({
                where: { id: userId },
                data: { favorites: { disconnect: { id } } }
            });
            res.json({ success: true, isFavorited: false });
        } else {
            // Favorite
            await prisma.user.update({
                where: { id: userId },
                data: { favorites: { connect: { id } } }
            });
            res.json({ success: true, isFavorited: true });
        }

    } catch (error) {
        console.error('Favorite error:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
};
