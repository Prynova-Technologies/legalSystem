"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
var config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '9000', 10),
    mongoose: {
        url: process.env.MONGODB_URI || 'mongodb://localhost:27017/law-firm-management',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d',
    },
    logs: process.env.LOG_LEVEL || 'debug',
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
    },
    email: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || 'user@example.com',
            pass: process.env.SMTP_PASSWORD || 'password',
        },
        from: process.env.EMAIL_FROM || 'Law Firm <no-reply@lawfirm.com>',
    },
};
exports.default = config;
