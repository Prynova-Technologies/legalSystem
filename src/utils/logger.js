"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWithRequest = void 0;
var winston_1 = __importDefault(require("winston"));
var config_1 = __importDefault(require("../config/config"));
// Define log format
var logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Custom format to include request context
var requestContextFormat = winston_1.default.format(function (info, opts) {
    if (info.req) {
        var req = info.req;
        // Add device info if available
        if (req.deviceInfo) {
            info.deviceInfo = req.deviceInfo;
        }
        // Add user info if available
        if (req.user) {
            info.userId = req.user._id;
            info.userRole = req.user.role;
        }
        // Add request details
        info.requestId = req.headers['x-request-id'] || 'unknown';
        info.method = req.method;
        info.url = req.originalUrl || req.url;
        info.ip = req.ip || req.socket.remoteAddress;
        // Remove the request object to avoid circular references
        delete info.req;
    }
    return info;
});
// Create logger instance
var logger = winston_1.default.createLogger({
    level: config_1.default.logs,
    format: winston_1.default.format.combine(requestContextFormat(), logFormat),
    defaultMeta: { service: 'law-firm-api' },
    transports: [
        // Write logs with level 'error' and below to error.log
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs to combined.log
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// Helper function to log with request context
var logWithRequest = function (level, message, req, meta) {
    if (meta === void 0) { meta = {}; }
    logger.log(__assign({ level: level, message: message, req: req }, meta));
};
exports.logWithRequest = logWithRequest;
// If we're not in production, also log to the console
if (config_1.default.env !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
exports.default = logger;
