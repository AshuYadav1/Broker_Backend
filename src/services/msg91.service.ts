import axios from 'axios';

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';
const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

export const sendOTP = async (mobile: string) => {
    if (!AUTH_KEY || !TEMPLATE_ID) {
        throw new Error('MSG91 configuration missing');
    }

    try {
        const response = await axios.post(`${MSG91_BASE_URL}/otp`, null, {
            params: {
                template_id: TEMPLATE_ID,
                mobile: mobile,
                authkey: AUTH_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('MSG91 Send OTP Error:', error);
        throw new Error('Failed to send OTP');
    }
};

export const verifyOTP = async (mobile: string, otp: string) => {
    if (!AUTH_KEY) {
        throw new Error('MSG91 configuration missing');
    }

    try {
        const response = await axios.get(`${MSG91_BASE_URL}/otp/verify`, {
            params: {
                mobile: mobile,
                otp: otp,
                authkey: AUTH_KEY
            }
        });

        // MSG91 returns success type in response
        if (response.data.type === 'success') {
            return true;
        }
        return false;
    } catch (error) {
        console.error('MSG91 Verify OTP Error:', error);
        return false;
    }
};
