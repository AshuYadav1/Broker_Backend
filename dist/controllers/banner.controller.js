"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBanner = exports.createBanner = exports.getBanners = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getBanners = async (req, res) => {
    try {
        const banners = await prisma_1.default.banner.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: banners });
    }
    catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getBanners = getBanners;
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, imageUrl, category } = req.body;
        const banner = await prisma_1.default.banner.create({
            data: { title, subtitle, imageUrl, category, active: true }
        });
        res.status(201).json({ success: true, data: banner });
    }
    catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
};
exports.createBanner = createBanner;
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.banner.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Banner deleted' });
    }
    catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
};
exports.deleteBanner = deleteBanner;
