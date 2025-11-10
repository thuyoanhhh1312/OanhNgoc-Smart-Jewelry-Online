import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy dữ liệu từ query string ?orderId=xxx
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2 style={{ color: '#003468' }}>🎉 Thanh toán VNPay thành công!</h2>
      <p>
        Mã đơn hàng: <strong>{orderId}</strong>
      </p>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2, backgroundColor: '#003468' }}
        onClick={() => navigate('/')}
      >
        Quay lại trang chủ
      </Button>
    </div>
  );
};

export default PaymentResult;
