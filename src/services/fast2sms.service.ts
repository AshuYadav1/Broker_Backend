import axios from 'axios';
import prisma from '../prisma';

const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';
const API_KEY = process.env.FAST2SMS_API_KEY;
const SENDER_ID = process.env.FAST2SMS_SENDER_ID;
const TEMPLATE_ID = process.env.FAST2SMS_TEMPLATE_ID;
const ENTITY_ID = process.env.FAST2SMS_ENTITY_ID;
const TEMPLATE_MESSAGE = process.env.FAST2SMS_TEMPLATE_MESSAGE;

const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFICATION_ATTEMPTS = 3;

import crypto from 'crypto';

/**
 * Generate a random 6-digit OTP (Cryptographically Secure)
 */
const generateOTP = (): string => {
    return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Clean up expired OTPs from database
 */
const cleanupExpiredOTPs = async () => {
    try {
        await prisma.oTP.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Cleanup expired OTPs error:', error);
    }
};

/**
 * Send OTP via Fast2SMS
 * @param mobile - Phone number (10 digits)
 */
export const sendOTP = async (mobile: string) => {
    if (!API_KEY || !SENDER_ID || !TEMPLATE_ID || !ENTITY_ID || !TEMPLATE_MESSAGE) {
        throw new Error('Fast2SMS configuration missing. Please check environment variables.');
    }

    try {
        // Clean up expired OTPs first
        await cleanupExpiredOTPs();

        // Delete any existing OTP for this number
        await prisma.oTP.deleteMany({
            where: { phoneNumber: mobile }
        });

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

        // Store OTP in database
        await prisma.oTP.create({
            data: {
                phoneNumber: mobile,
                otp: otp,
                expiresAt: expiresAt
            }
        });

        // Prepare message by replacing {#var#} with actual OTP
        const message = TEMPLATE_MESSAGE.replace('{#var#}', otp);

        // Send OTP via Fast2SMS DLT Manual API
        const response = await axios.get(FAST2SMS_BASE_URL, {
            params: {
                authorization: API_KEY,
                route: 'dlt_manual',
                sender_id: SENDER_ID,
                message: message,
                template_id: TEMPLATE_ID,
                entity_id: ENTITY_ID,
                numbers: mobile
            }
        });

        console.log('Fast2SMS Response:', response.data);

        if (response.data.return === false) {
            throw new Error(response.data.message || 'Failed to send OTP via Fast2SMS');
        }

        return {
            success: true,
            message: 'OTP sent successfully',
            expiresAt: expiresAt
        };
    } catch (error: any) {
        console.error('Fast2SMS Send OTP Error:', error.response?.data || error.message);
        throw new Error('Failed to send OTP');
    }
};

/**
 * Verify OTP entered by user
 * @param mobile - Phone number
 * @param otp - OTP entered by user
 */
export const verifyOTP = async (mobile: string, otp: string): Promise<boolean> => {
    try {
        // Find the OTP record
        const otpRecord = await prisma.oTP.findFirst({
            where: {
                phoneNumber: mobile,
                verified: false
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!otpRecord) {
            console.log('No OTP found for mobile:', mobile);
            return false;
        }

        // Check if OTP has expired
        if (new Date() > otpRecord.expiresAt) {
            console.log('OTP expired for mobile:', mobile);
            await prisma.oTP.delete({ where: { id: otpRecord.id } });
            return false;
        }

        // Check if max attempts exceeded
        if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
            console.log('Max verification attempts exceeded for mobile:', mobile);
            await prisma.oTP.delete({ where: { id: otpRecord.id } });
            return false;
        }

        // Increment attempt counter
        await prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { attempts: otpRecord.attempts + 1 }
        });

        // Verify OTP
        if (otpRecord.otp === otp) {
            // Mark as verified and delete
            await prisma.oTP.update({
                where: { id: otpRecord.id },
                data: { verified: true }
            });

            // Clean up verified OTP
            await prisma.oTP.delete({ where: { id: otpRecord.id } });

            console.log('OTP verified successfully for mobile:', mobile);
            return true;
        }

        console.log('Invalid OTP for mobile:', mobile);
        return false;
    } catch (error) {
        console.error('Fast2SMS Verify OTP Error:', error);
        return false;
    }
};
