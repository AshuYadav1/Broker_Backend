import { z } from 'zod';

export const createPropertySchema = z.object({
    body: z.object({
        title: z.string().min(3),
        price: z.number().transform((val) => Number(val)).pipe(z.number().positive()), // Handle string->number conversion for multipart/form-data
        location: z.string().min(3),
        type: z.enum(['Sale', 'Rent']),
        category: z.string(),
        description: z.string().optional(),
        // Images/Videos are handled by multer, but we can validate other fields here
    }),
});
