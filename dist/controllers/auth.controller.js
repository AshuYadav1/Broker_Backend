"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = exports.registerAdmin = exports.verifyMobileOTP = exports.sendMobileOTP = void 0;
const fast2sms = __importStar(require("../services/fast2sms.service"));
const prisma_1 = __importDefault(require("../prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
// --- Mobile Auth (OTP) ---
const sendMobileOTP = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            res.status(400).json({ error: 'Mobile number required' });
            return;
        }
        await fast2sms.sendOTP(mobile);
        res.json({ success: true, message: 'OTP sent successfully' });
    }
    catch (error) {
        // console.error(error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};
exports.sendMobileOTP = sendMobileOTP;
const verifyMobileOTP = async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            res.status(400).json({ error: 'Mobile and OTP required' });
            return;
        }
        const isValid = await fast2sms.verifyOTP(mobile, otp);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid OTP' });
            return;
        }
        // Find or create user
        let user = await prisma_1.default.user.findUnique({ where: { phoneNumber: mobile } });
        let isNewUser = false;
        if (!user) {
            user = await prisma_1.default.user.create({
                data: { phoneNumber: mobile }
            });
            isNewUser = true;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            success: true,
            token,
            user,
            isNewUser
        });
    }
    catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.verifyMobileOTP = verifyMobileOTP;
// --- Admin Auth (Email/Pass) ---
const registerAdmin = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }
        const existing = await prisma_1.default.admin.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ error: 'Admin already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const admin = await prisma_1.default.admin.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });
        res.json({ success: true, message: 'Admin created', admin: { id: admin.id, email: admin.email } });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.registerAdmin = registerAdmin;
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await prisma_1.default.admin.findUnique({ where: { email } });
        if (!admin || !await bcryptjs_1.default.compare(password, admin.password)) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({
            success: true,
            token,
            admin: { id: admin.id, email: admin.email, name: admin.name }
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.loginAdmin = loginAdmin;
