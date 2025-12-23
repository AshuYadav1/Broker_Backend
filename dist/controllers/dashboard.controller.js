"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getStats = async (req, res) => {
    try {
        const [propertiesCount, usersCount, leadsCount, recentLeads] = await Promise.all([
            prisma_1.default.property.count(),
            prisma_1.default.user.count(),
            prisma_1.default.interaction.count({ where: { interactionType: 'enquiry' } }),
            prisma_1.default.interaction.findMany({
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
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getStats = getStats;
