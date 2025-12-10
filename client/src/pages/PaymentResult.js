import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '@mui/material';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Lấy danh sách sản phẩm vừa mua từ localStorage
    const purchasedItemsStr = localStorage.getItem('purchasedItems');
    if (purchasedItemsStr) {
      try {
        const purchasedProductIds = JSON.parse(purchasedItemsStr);
        // Xóa các sản phẩm vừa mua khỏi giỏ
        dispatch({
          type: 'REMOVE_CART_ITEMS',
          payload: purchasedProductIds,
        });
        // Xóa flag sau khi xử lý xong
        localStorage.removeItem('purchasedItems');
      } catch (e) {
        console.error('Lỗi xử lý danh sách sản phẩm đã mua:', e);
      }
    }
  }, [dispatch]);
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
