"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeads = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [leads, total] = await Promise.all([
            prisma_1.default.interaction.findMany({
                where: { interactionType: 'enquiry' },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.interaction.count({ where: { interactionType: 'enquiry' } })
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
    }
    catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getLeads = getLeads;
