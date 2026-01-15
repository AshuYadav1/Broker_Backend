import { z } from 'zod';

export const createPropertySchema = z.object({
    body: z.object({
        title: z.string().min(3),
        price: z.union([z.string(), z.number().transform(val => String(val))]), // Accept String or Number (converted to string)
        location: z.string().min(3),
        type: z.string(), // Relaxed from Enum to allow various casing for now
        category: z.string().optional().default('General'), // Allow optional
        description: z.string().optional(),
        latitude: z.any().transform(val => Number(val || 0)).optional(),
        longitude: z.any().transform(val => Number(val || 0)).optional(),
        availability: z.string().optional(),
        // Images/Videos are handled by multer, but we can validate other fields here
    }),
});
