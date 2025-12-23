"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_1 = require("../middleware/upload.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const ratelimit_middleware_1 = require("../middleware/ratelimit.middleware");
const router = (0, express_1.Router)();
// Rate Limit: 100 uploads per 10 minutes
const uploadLimiter = (0, ratelimit_middleware_1.rateLimiter)(100, 600, 'upload');
router.post('/', uploadLimiter, upload_middleware_1.upload.single('file'), upload_controller_1.uploadFile);
exports.default = router;
