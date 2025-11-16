import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, Card } from 'antd';
import { toast } from 'react-toastify';
import { resetPasswordWithToken } from '../../api/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthPageLayout';

const { Title, Text } = Typography;
const EMAIL_STORAGE_KEY = 'fp_email';
const TOKEN_STORAGE_KEY = 'fp_reset_token';

const ResetPasswordPage = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const resetToken = location.state?.resetToken || sessionStorage.getItem(TOKEN_STORAGE_KEY);

    useEffect(() => {
        if (!resetToken) {
            toast.error('Vui lòng hoàn tất bước xác thực OTP trước.');
            navigate('/forgot-password');
        }
    }, [resetToken, navigate]);

    const onFinish = async ({ password, confirmPassword }) => {
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            await resetPasswordWithToken({
                reset_token: resetToken,
                new_password: password,
            });
            toast.success('Cập nhật mật khẩu thành công.');
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
            sessionStorage.removeItem(EMAIL_STORAGE_KEY);
            navigate('/signin');
        } catch (error) {
            const message = error?.response?.data?.message || 'Không thể cập nhật mật khẩu.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="flex justify-center items-center w-full min-h-screen bg-gray-50 p-4">
                <Card style={{ maxWidth: 420, width: '100%' }} variant="outlined" className="shadow-md rounded-lg">
                    <Title level={3} className="text-center mb-2">Đặt lại mật khẩu</Title>
                    <Text className="block text-center text-gray-600">
                        Hãy tạo mật khẩu mới an toàn cho tài khoản của bạn.
                    </Text>

                    <Form
                        name="reset_password"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                        scrollToFirstError
                        className="mt-6"
                    >
                        <Form.Item
                            name="password"
                            label="Mật khẩu mới"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' },
                            ]}
                            hasFeedback
                        >
                            <Input.Password
                                placeholder="Nhập mật khẩu mới"
                                size="large"
                                visibilityToggle
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                placeholder="Nhập lại mật khẩu mới"
                                size="large"
                                visibilityToggle
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading} size="large">
                                Xác nhận
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
