import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Space, Typography } from 'antd';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendPasswordResetOtp, verifyPasswordResetOtp } from '../../api/auth';
import AuthLayout from './AuthPageLayout';

const { Title, Text } = Typography;
const EMAIL_STORAGE_KEY = 'fp_email';
const TOKEN_STORAGE_KEY = 'fp_reset_token';
const RESEND_INTERVAL = 60;

const VerifyOtpPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [otpValues, setOtpValues] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(RESEND_INTERVAL);
    const inputRefs = useRef([]);

    const email = location.state?.email || sessionStorage.getItem(EMAIL_STORAGE_KEY);

    useEffect(() => {
        if (!email) {
            toast.error('Vui lòng nhập email trước.');
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const focusInput = (index) => {
        inputRefs.current[index]?.focus();
    };

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;

        const nextOtp = [...otpValues];
        nextOtp[index] = value;
        setOtpValues(nextOtp);

        if (value && index < otpValues.length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
            focusInput(index - 1);
        }
    };

    const handleSubmit = async () => {
        const otp = otpValues.join('');
        if (otp.length !== 6) {
            toast.error('Vui lòng nhập đủ 6 số OTP.');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyPasswordResetOtp({ email, otp });
            const token = response?.data?.reset_token;
            if (token) {
                sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
                toast.success('Xác thực OTP thành công.');
                navigate('/forgot-password/reset', {
                    state: { resetToken: token },
                });
            }
        } catch (error) {
            const message = error?.response?.data?.message || 'OTP không hợp lệ.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setResendLoading(true);
        try {
            await sendPasswordResetOtp(email);
            setCountdown(RESEND_INTERVAL);
            setOtpValues(Array(6).fill(''));
            focusInput(0);
            toast.success('OTP mới đã được gửi.');
        } catch (error) {
            const message = error?.response?.data?.message || 'Không thể gửi lại OTP.';
            toast.error(message);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="flex justify-center items-center w-full min-h-screen bg-gray-50 p-4">
                <Card style={{ maxWidth: 460, width: '100%' }} variant="outlined" className="shadow-md rounded-lg">
                    <Space direction="vertical" size="small" className="w-full">
                        <Title level={3} className="text-center">Xác thực OTP</Title>
                        <Text className="block text-center text-gray-600">
                            Nhập mã OTP đã được gửi đến <strong>{email}</strong>
                        </Text>
                    </Space>

                    <Space className="flex justify-center mt-6 mb-6" size="large">
                        {otpValues.map((value, index) => (
                            <Input
                                key={index}
                                value={value}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                maxLength={1}
                                inputMode="numeric"
                                pattern="\d*"
                                style={{ width: 48, height: 56, textAlign: 'center', fontSize: 24 }}
                                autoFocus={index === 0}
                            />
                        ))}
                    </Space>

                    <Space direction="vertical" className="w-full">
                        <Button type="primary" block size="large" loading={loading} onClick={handleSubmit}>
                            Xác thực OTP
                        </Button>
                        <Button
                            type="default"
                            block
                            size="large"
                            onClick={handleResend}
                            loading={resendLoading}
                            disabled={countdown > 0}
                        >
                            {countdown > 0 ? `Gửi lại OTP sau ${countdown}s` : 'Gửi lại OTP'}
                        </Button>
                    </Space>
                </Card>
            </div>
        </AuthLayout>
    );
};

export default VerifyOtpPage;
