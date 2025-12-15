import { Request, Response } from 'express';
import * as msg91 from '../services/msg91.service';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// --- Mobile Auth (OTP) ---

export const sendMobileOTP = async (req: Request, res: Response) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            res.status(400).json({ error: 'Mobile number required' });
            return;
        }

        await msg91.sendOTP(mobile);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

export const verifyMobileOTP = async (req: Request, res: Response) => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            res.status(400).json({ error: 'Mobile and OTP required' });
            return;
        }

        const isValid = await msg91.verifyOTP(mobile, otp);
        if (!isValid) {
            res.status(400).json({ error: 'Invalid OTP' });
            return;
        }

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phoneNumber: mobile } });

        let isNewUser = false;
        if (!user) {
            user = await prisma.user.create({
                data: { phoneNumber: mobile }
            });
            isNewUser = true;
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            token,
            user,
            isNewUser
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- Admin Auth (Email/Pass) ---

export const registerAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' });
            return;
        }

        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ error: 'Admin already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        res.json({ success: true, message: 'Admin created', admin: { id: admin.id, email: admin.email } });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin || !await bcrypt.compare(password, admin.password)) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            success: true,
            token,
            admin: { id: admin.id, email: admin.email, name: admin.name }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Login failed' });
    }
}
