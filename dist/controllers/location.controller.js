"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.createLocation = exports.getLocations = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getLocations = async (req, res) => {
    try {
        const locations = await prisma_1.default.location.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' }
        });
        res.json({ success: true, data: locations });
    }
    catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getLocations = getLocations;
const createLocation = async (req, res) => {
    try {
        const { name, priority } = req.body;
        const location = await prisma_1.default.location.create({
            data: { name, priority: priority ? parseInt(priority) : 0 }
        });
        res.json({ success: true, data: location });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create location' });
    }
};
exports.createLocation = createLocation;
const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.location.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true, message: 'Location deleted' });
    }
    catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ error: 'Failed to delete location' });
    }
};
exports.deleteLocation = deleteLocation;
