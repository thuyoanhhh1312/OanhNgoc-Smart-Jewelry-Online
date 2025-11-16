import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, Space } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { sendPasswordResetOtp } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthPageLayout';

const { Title, Text } = Typography;
const EMAIL_STORAGE_KEY = 'fp_email';
const TOKEN_STORAGE_KEY = 'fp_reset_token';

const ForgotPasswordRequestPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async ({ email }) => {
        setLoading(true);
        try {
            await sendPasswordResetOtp(email);
            sessionStorage.setItem(EMAIL_STORAGE_KEY, email);
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            toast.success('OTP đã được gửi tới email của bạn.');
            navigate('/forgot-password/verify', { state: { email } });
        } catch (error) {
            const message = error?.response?.data?.message || 'Gửi OTP thất bại. Vui lòng thử lại.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="flex justify-center items-center w-full min-h-screen bg-gray-50 p-4">
                <Card
                    style={{ maxWidth: 420, width: '100%' }}
                    variant="outlined"
                    className="shadow-md rounded-lg"
                >
                    <Space direction="vertical" size="small" className="w-full">
                        <Title level={3} className="text-center">Quên mật khẩu</Title>
                        <Text className="block text-center text-gray-600">
                            Nhập email để nhận mã OTP khôi phục mật khẩu.
                        </Text>
                    </Space>

                    <Form
                        name="forgot_password"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                        className="mt-6"
                    >
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email!' },
                                { type: 'email', message: 'Email không hợp lệ!' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="example@domain.com"
                                size="large"
                                autoComplete="email"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading} size="large">
                                Gửi OTP
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordRequestPage;
