import { Request, Response } from 'express';
import prisma from '../prisma';

export const getLeads = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [leads, total] = await Promise.all([
            prisma.interaction.findMany({
                where: { interactionType: 'enquiry' },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.interaction.count({ where: { interactionType: 'enquiry' } })
        ]);

        res.json({
            success: true,
            data: leads,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
