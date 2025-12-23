"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPropertySchema = void 0;
const zod_1 = require("zod");
exports.createPropertySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        price: zod_1.z.number().transform((val) => Number(val)).pipe(zod_1.z.number().positive()), // Handle string->number conversion for multipart/form-data
        location: zod_1.z.string().min(3),
        type: zod_1.z.string(), // Relaxed from Enum to allow various casing for now
        category: zod_1.z.string().optional().default('General'), // Allow optional
        description: zod_1.z.string().optional(),
        latitude: zod_1.z.any().transform(val => Number(val || 0)).optional(),
        longitude: zod_1.z.any().transform(val => Number(val || 0)).optional(),
        // Images/Videos are handled by multer, but we can validate other fields here
    }),
});
