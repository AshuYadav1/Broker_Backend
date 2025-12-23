import { Request, Response } from 'express';
import prisma from '../prisma';

export const getStats = async (req: Request, res: Response) => {
    try {
        const [
            propertiesCount,
            usersCount,
            leadsCount,
            recentLeads
        ] = await Promise.all([
            prisma.property.count(),
            prisma.user.count(),
            prisma.interaction.count({ where: { interactionType: 'enquiry' } }),
            prisma.interaction.findMany({
                where: { interactionType: 'enquiry' },
                take: 5,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Calculate simple trends (mock logic or real if we had historical data)
        // For now, returning flat counts

        res.json({
            success: true,
            stats: {
                properties: { total: propertiesCount, trend: 0 },
                users: { total: usersCount, trend: 0 },
                leads: { total: leadsCount, trend: 0 },
                likes: { total: 0, trend: 0 } // Likes not yet fully tracked in interaction table migration
            },
            recentLeads
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
