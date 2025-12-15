import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { Logger } from '../utils/logger';

export const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error: any) {
        Logger.warn(`[Validation Error]: ${JSON.stringify(error.issues)}`);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.issues
        });
    }
};
