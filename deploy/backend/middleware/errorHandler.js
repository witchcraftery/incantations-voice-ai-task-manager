"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('❌ Unhandled error:', err);
    // Default error
    let error = {
        status: 500,
        message: 'Internal server error'
    };
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = { status: 401, message: 'Invalid token' };
    }
    else if (err.name === 'TokenExpiredError') {
        error = { status: 401, message: 'Token expired' };
    }
    // Validation errors
    if (err.name === 'ZodError') {
        error = { status: 400, message: 'Validation error' };
    }
    // Database errors
    if (err.code === '23505') { // Unique constraint violation
        error = { status: 409, message: 'Resource already exists' };
    }
    res.status(error.status).json({
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map