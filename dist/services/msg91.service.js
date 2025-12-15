"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.sendOTP = void 0;
const axios_1 = __importDefault(require("axios"));
const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';
const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const sendOTP = async (mobile) => {
    if (!AUTH_KEY || !TEMPLATE_ID) {
        throw new Error('MSG91 configuration missing');
    }
    try {
        const response = await axios_1.default.post(`${MSG91_BASE_URL}/otp`, null, {
            params: {
                template_id: TEMPLATE_ID,
                mobile: mobile,
                authkey: AUTH_KEY
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('MSG91 Send OTP Error:', error);
        throw new Error('Failed to send OTP');
    }
};
exports.sendOTP = sendOTP;
const verifyOTP = async (mobile, otp) => {
    if (!AUTH_KEY) {
        throw new Error('MSG91 configuration missing');
    }
    try {
        const response = await axios_1.default.get(`${MSG91_BASE_URL}/otp/verify`, {
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
    }
    catch (error) {
        console.error('MSG91 Verify OTP Error:', error);
        return false;
    }
};
exports.verifyOTP = verifyOTP;
