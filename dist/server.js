"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const property_routes_1 = __importDefault(require("./routes/property.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const storage_service_1 = require("./services/storage.service");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
// 1. Security Middleware
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// CORS
app.use((0, cors_1.default)({
    origin: ['https://royalkey.in', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// 2. Routes
app.use('/auth', auth_routes_1.default);
app.use('/properties', property_routes_1.default);
app.use('/upload', upload_routes_1.default);
// 3. Static Files (CDN Optimized)
const publicDir = path_1.default.join(__dirname, '../public');
app.use('/media', (req, res, next) => {
    // Cache HLS fragments (.ts) and images forever (1 year)
    if (req.url.endsWith('.ts') || req.url.endsWith('.jpg') || req.url.endsWith('.png')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // Cache Manifests (.m3u8) for less time (e.g., 5 mins)
    else if (req.url.endsWith('.m3u8')) {
        res.setHeader('Cache-Control', 'public, max-age=300');
    }
    next();
}, express_1.default.static(publicDir));
// 4. Background Services
// Storage Rotation (Run every hour)
setInterval(() => {
    (0, storage_service_1.checkAndRotateStorage)();
}, 60 * 60 * 1000);
// Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure Media Server running on port ${PORT}`);
});
