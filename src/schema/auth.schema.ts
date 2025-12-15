import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email" }),
        password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    }),
});

export const otpRequestSchema = z.object({
    body: z.object({
        mobile: z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be 10 digits" }),
    }),
});

export const otpVerifySchema = z.object({
    body: z.object({
        mobile: z.string().regex(/^[0-9]{10}$/, { message: "Mobile number must be 10 digits" }),
        otp: z.string().length(4, { message: "OTP must be 4 digits" }),
    }),
});


