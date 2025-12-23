import { z } from 'zod';

export const createPropertySchema = z.object({
    body: z.object({
        title: z.string().min(3),
        price: z.number().transform((val) => Number(val)).pipe(z.number().positive()), // Handle string->number conversion for multipart/form-data
        location: z.string().min(3),
        type: z.string(), // Relaxed from Enum to allow various casing for now
        category: z.string().optional().default('General'), // Allow optional
        description: z.string().optional(),
        latitude: z.any().transform(val => Number(val || 0)).optional(),
        longitude: z.any().transform(val => Number(val || 0)).optional(),
        // Images/Videos are handled by multer, but we can validate other fields here
    }),
});
