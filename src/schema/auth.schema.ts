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
        otp: z.string().length(6, { message: "OTP must be 6 digits" }),
    }),
});

export const profileUpdateSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        pincode: z.string().regex(/^[0-9]{6}$/, { message: "Invalid pincode" }).optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        address: z.string().optional(),
    }),
});


