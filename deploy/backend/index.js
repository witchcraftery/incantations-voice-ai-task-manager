"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.db = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
const auth_1 = require("./routes/auth");
const user_1 = require("./routes/user");
const tasks_1 = require("./routes/tasks");
const sync_1 = require("./routes/sync");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", "https://openrouter.ai", "https://www.googleapis.com"],
        },
    },
}));
app.use((0, compression_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://incantations.witchcraftery.io', 'https://witchcraftery.io']
        : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Database setup
exports.db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Redis setup
exports.redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API routes
app.use('/api/auth', auth_1.authRouter);
app.use('/api/user', user_1.userRouter);
app.use('/api/tasks', tasks_1.taskRouter);
app.use('/api/sync', sync_1.syncRouter);
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
async function startServer() {
    try {
        // Test database connection
        await exports.db.query('SELECT NOW()');
        logger_1.logger.info('✅ Database connected');
        // Connect to Redis
        await exports.redis.connect();
        logger_1.logger.info('✅ Redis connected');
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Incantations API server running on port ${PORT}`);
            logger_1.logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    logger_1.logger.info('🛑 Shutting down gracefully...');
    await exports.db.end();
    await exports.redis.quit();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map