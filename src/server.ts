import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import uploadRoutes from './routes/upload.routes';
import { checkAndRotateStorage } from './services/storage.service';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// 1. Security Middleware
app.use(helmet());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CORS
app.use(cors({
    origin: ['https://royalkey.in', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Routes
app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/upload', uploadRoutes);

// 3. Static Files (CDN Optimized)
const publicDir = path.join(__dirname, '../public');
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
}, express.static(publicDir));

// 4. Background Services
// Storage Rotation (Run every hour)
setInterval(() => {
    checkAndRotateStorage();
}, 60 * 60 * 1000);

// Start
app.listen(PORT, '0.0.0.0' as any, () => {
    console.log(`Secure Media Server running on port ${PORT}`);
});
