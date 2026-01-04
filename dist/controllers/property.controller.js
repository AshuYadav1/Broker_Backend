"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFavorite = exports.getSetting = exports.recordInteraction = exports.deleteProperty = exports.updateProperty = exports.createProperty = exports.getProperty = exports.getProperties = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Helper for pagination/filtering
const getProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { type, city } = req.query;
        const where = {};
        if (type)
            where.type = type;
        if (city)
            where.city = city;
        const [properties, total] = await Promise.all([
            prisma_1.default.property.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.property.count({ where })
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
    }
    catch (error) {
        console.error('Get properties error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getProperties = getProperties;
const getProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await prisma_1.default.property.findUnique({ where: { id } });
        if (!property) {
            res.status(404).json({ error: 'Property not found' });
            return;
        }
        res.json({ success: true, data: property });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getProperty = getProperty;
const createProperty = async (req, res) => {
    try {
        const data = req.body;
        // Basic validation could go here
        const property = await prisma_1.default.property.create({
            data: {
                ...data,
                latitude: data.latitude || 0.0,
                longitude: data.longitude || 0.0,
                // Ensure array fields are arrays of strings 
                // in case they come in differently, though Prisma handles types strictly
            }
        });
        res.json({ success: true, data: property });
    }
    catch (error) {
        console.error('Create property error:', error);
        res.status(500).json({ error: 'Failed to create property' });
    }
};
exports.createProperty = createProperty;
const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const property = await prisma_1.default.property.update({
            where: { id },
            data
        });
        res.json({ success: true, data: property });
    }
    catch (error) {
        console.error('Update property error:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
};
exports.updateProperty = updateProperty;
const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.property.delete({ where: { id } });
        res.json({ success: true, message: 'Property deleted' });
    }
    catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};
exports.deleteProperty = deleteProperty;
const recordInteraction = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { interactionType, propertyId, propertyTitle, message, details } = req.body;
        const user = userId ? await prisma_1.default.user.findUnique({ where: { id: userId } }) : null;
        const interaction = await prisma_1.default.interaction.create({
            data: {
                userId,
                userName: user?.name,
                userPhone: user?.phoneNumber,
                interactionType,
                propertyId,
                propertyTitle,
                message,
                details
            }
        });
        res.json({ success: true, data: interaction });
    }
    catch (error) {
        console.error('Record interaction error:', error);
        res.status(500).json({ error: 'Failed to record interaction' });
    }
};
exports.recordInteraction = recordInteraction;
const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await prisma_1.default.setting.findUnique({ where: { key } });
        res.json({ success: true, data: setting ? setting.value : null });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getSetting = getSetting;
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params; // Property ID
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Check if already favorited
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { favorites: { where: { id } } }
        });
        const isFavorited = user?.favorites.length ? user.favorites.length > 0 : false;
        if (isFavorited) {
            // Unfavorite
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { favorites: { disconnect: { id } } }
            });
            res.json({ success: true, isFavorited: false });
        }
        else {
            // Favorite
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { favorites: { connect: { id } } }
            });
            res.json({ success: true, isFavorited: true });
        }
    }
    catch (error) {
        console.error('Favorite error:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
};
exports.toggleFavorite = toggleFavorite;
