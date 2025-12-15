"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const logger_1 = require("../utils/logger");
const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        logger_1.Logger.warn(`[Validation Error]: ${JSON.stringify(error.issues)}`);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.issues
        });
    }
};
exports.validate = validate;
