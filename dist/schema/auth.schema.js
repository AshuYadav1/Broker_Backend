"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpVerifySchema = exports.otpRequestSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email" }),
        password: zod_1.z.string().min(6, { message: "Password must be at least 6 characters" }),
    }),
});
exports.otpRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        mobile: zod_1.z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be 10 digits" }),
    }),
});
exports.otpVerifySchema = zod_1.z.object({
    body: zod_1.z.object({
        mobile: zod_1.z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be 10 digits" }),
        otp: zod_1.z.string().length(4, { message: "OTP must be 4 digits" }),
    }),
});
