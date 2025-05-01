"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
var user_model_1 = __importDefault(require("../models/user.model"));
var logger_1 = __importDefault(require("../utils/logger"));
/**
 * Service for user-related operations
 */
var UserService = /** @class */ (function () {
    function UserService() {
    }
    /**
     * Get all users
     */
    UserService.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_model_1.default.find().select('-password -resetPasswordToken -resetPasswordExpire')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.default.error('Error fetching all users', { error: error_1 });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user by ID
     */
    UserService.getUserById = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_model_1.default.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire')];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.default.error('Error fetching user by ID', { error: error_2, userId: userId });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user by email
     */
    UserService.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_model_1.default.findByEmail(email)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.default.error('Error fetching user by email', { error: error_3, email: email });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a new user
     */
    UserService.createUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_model_1.default.create(userData)];
                    case 1:
                        user = _a.sent();
                        logger_1.default.info('New user created', { userId: user._id });
                        return [2 /*return*/, user];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.default.error('Error creating user', { error: error_4, userData: userData });
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update a user
     */
    UserService.updateUser = function (userId, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var user_1, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, user_model_1.default.findById(userId)];
                    case 1:
                        user_1 = _a.sent();
                        if (!user_1)
                            return [2 /*return*/, null];
                        // Update user fields
                        Object.keys(updateData).forEach(function (key) {
                            if (updateData[key] !== undefined) {
                                user_1[key] = updateData[key];
                            }
                        });
                        return [4 /*yield*/, user_1.save()];
                    case 2:
                        _a.sent();
                        logger_1.default.info('User updated', { userId: userId });
                        return [2 /*return*/, user_1];
                    case 3:
                        error_5 = _a.sent();
                        logger_1.default.error('Error updating user', { error: error_5, userId: userId, updateData: updateData });
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete a user
     */
    UserService.deleteUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_model_1.default.findByIdAndDelete(userId)];
                    case 1:
                        result = _a.sent();
                        if (result) {
                            logger_1.default.info('User deleted', { userId: userId });
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.default.error('Error deleting user', { error: error_6, userId: userId });
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Change user password
     */
    UserService.changePassword = function (userId, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, user_model_1.default.findById(userId).select('+password')];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, false];
                        user.password = newPassword;
                        return [4 /*yield*/, user.save()];
                    case 2:
                        _a.sent();
                        logger_1.default.info('User password changed', { userId: userId });
                        return [2 /*return*/, true];
                    case 3:
                        error_7 = _a.sent();
                        logger_1.default.error('Error changing user password', { error: error_7, userId: userId });
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify current password
     */
    UserService.verifyPassword = function (userId, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, user_model_1.default.findById(userId).select('+password')];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, user.comparePassword(password)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_8 = _a.sent();
                        logger_1.default.error('Error verifying user password', { error: error_8, userId: userId });
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return UserService;
}());
exports.UserService = UserService;
