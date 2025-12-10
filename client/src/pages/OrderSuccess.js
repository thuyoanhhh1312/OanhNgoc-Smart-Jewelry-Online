import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper, Divider, Stack, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MainLayout from '../layout/MainLayout';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu đơn hàng từ location.state (COD) hoặc query string (VNPay)
  const stateOrder = location.state?.order;
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');
  const orderDataStr = params.get('orderData');

  useEffect(() => {
    // Lấy danh sách sản phẩm vừa mua từ localStorage hoặc state
    let purchasedProductIds = [];

    // Cách 1: Từ localStorage (từ VNPay redirect)
    const purchasedItemsStr = localStorage.getItem('purchasedItems');
    if (purchasedItemsStr) {
      try {
        purchasedProductIds = JSON.parse(purchasedItemsStr);
        localStorage.removeItem('purchasedItems');
      } catch (e) {
        console.error('Lỗi parse purchasedItems:', e);
      }
    }

    // Cách 2: Từ location.state (từ COD trực tiếp)
    const purchasedItems = location.state?.selectedItems || [];
    if (purchasedItems.length > 0 && purchasedProductIds.length === 0) {
      purchasedProductIds = purchasedItems.map((item) => item.product_id);
    }

    // Xóa những item đã mua khỏi giỏ hàng
    if (purchasedProductIds.length > 0) {
      dispatch({
        type: 'REMOVE_CART_ITEMS',
        payload: purchasedProductIds,
      });
    }

    if (stateOrder) {
      // Có dữ liệu từ state (COD)
      setOrder(stateOrder);
      setLoading(false);
    } else if (orderId) {
      // Luôn fetch từ API khi có orderId (VNPay hoặc fallback)
      const fetchOrder = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL;
          const response = await fetch(`${apiUrl}/payment/order-details/${orderId}`);
          if (!response.ok) throw new Error('Failed to fetch');
          const data = await response.json();
          // Normalize dữ liệu từ API: API trả về { order, items }
          // Và order có cấu trúc flat với customer_name thay vì Customer.name
          const normalizedOrder = {
            ...data.order,
            Customer: {
              name: data.order.customer_name || 'N/A',
              email: data.order.email || 'N/A',
              phone: data.order.phone || 'N/A',
            },
          };
          setOrder(normalizedOrder);
        } catch (error) {
          console.error('Lỗi fetch order:', error);
          // Fallback: parse từ query string nếu API fail
          if (orderDataStr) {
            try {
              const parsedOrder = JSON.parse(decodeURIComponent(orderDataStr));
              // Cũng normalize dữ liệu từ query string
              if (!parsedOrder.Customer) {
                parsedOrder.Customer = {
                  name: parsedOrder.customer_name || 'N/A',
                  email: parsedOrder.email || 'N/A',
                  phone: parsedOrder.phone || 'N/A',
                };
              }
              setOrder(parsedOrder);
            } catch (e) {
              console.error('Lỗi parse orderData:', e);
              setOrder({
                order_id: orderId,
                Customer: { name: 'N/A', email: 'N/A', phone: 'N/A' },
              });
            }
          } else {
            setOrder({
              order_id: orderId,
              Customer: { name: 'N/A', email: 'N/A', phone: 'N/A' },
            });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [stateOrder, orderId, orderDataStr, dispatch]);

  // Format tiền Việt
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          maxWidth: 700,
          margin: '40px auto',
          padding: 4,
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 3,
          textAlign: 'center',
          color: '#003468',
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />

        {/* ✅ Hiển thị tiêu đề khác nhau tùy theo loại thanh toán */}
        {order?.payment_method === 'vnpay' && order?.status_id === 2 ? (
          <>
            <Typography variant="h4" fontWeight="bold" mb={1}>
              Thanh toán thành công!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={3}>
              Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý và sẽ sớm được gửi đi.
            </Typography>
          </>
        ) : order?.payment_method === 'vnpay' && order?.status_id === 1 ? (
          <>
            <Typography variant="h4" fontWeight="bold" mb={1}>
              Cọc 10% thành công!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={2}>
              Cảm ơn bạn đã cọc 10%. Bạn sẽ thanh toán phần còn lại khi nhận hàng.
            </Typography>
            {/* 🔴 Hiển thị số tiền còn thiếu cho COD deposit */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mb: 3,
                bgcolor: '#fff3cd',
                border: '2px solid #ff9800',
                borderRadius: 2,
              }}
            >
              <Typography fontWeight="bold" color="#e65100" mb={1}>
                ⚠️ Số tiền còn phải thanh toán khi nhận hàng:
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error">
                {formatCurrency(order.total * 0.9 || 0)}
              </Typography>
            </Paper>
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight="bold" mb={1}>
              Đặt hàng thành công!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" mb={3}>
              Cảm ơn bạn đã tin tưởng và đặt mua sản phẩm tại PNJ. Đơn hàng của bạn đang được xử lý.
            </Typography>
          </>
        )}

        {order ? (
          <Paper
            elevation={1}
            sx={{
              textAlign: 'left',
              p: 3,
              mb: 4,
              bgcolor: '#e3f2fd',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Thông tin đơn hàng
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography>
              <strong>Mã đơn hàng:</strong> {order.order_id || 'N/A'}
            </Typography>
            <Typography>
              <strong>Khách hàng:</strong> {order.Customer?.name || order.customer_name || 'N/A'}
            </Typography>
            <Typography>
              <strong>Email:</strong> {order.Customer?.email || order.email || 'N/A'}
            </Typography>
            <Typography>
              <strong>Số điện thoại:</strong> {order.Customer?.phone || order.phone || 'N/A'}
            </Typography>
            <Typography>
              <strong>Địa chỉ giao hàng:</strong> {order.shipping_address || 'N/A'}
            </Typography>
            <Typography>
              <strong>Phương thức thanh toán:</strong>{' '}
              {order.payment_method === 'cod'
                ? 'Thanh toán khi nhận hàng (COD)'
                : order.payment_method === 'vnpay'
                  ? 'Thanh toán bằng VNPay'
                  : 'Không xác định'}
            </Typography>
            <Typography>
              <strong>Tạm tính:</strong> {formatCurrency(order.sub_total || 0)}
            </Typography>
            <Typography>
              <strong>Giảm giá:</strong>{' '}
              <span style={{ color: '#d32f2f' }}>- {formatCurrency(order.discount || 0)}</span>
            </Typography>
            <Typography fontWeight="bold" fontSize="1.2rem" mt={1}>
              Tổng cộng: {formatCurrency(order.total || 0)}
            </Typography>
          </Paper>
        ) : (
          <Typography color="text.secondary" mb={3}>
            Không có thông tin đơn hàng hiển thị.
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate(`/order-history`)}
          sx={{
            marginRight: 2,
            backgroundColor: '#003468',
            color: '#fff',
            '&:hover': { backgroundColor: '#002954' },
          }}
        >
          Xem chi tiết đơn hàng
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={() => navigate('/')}
          sx={{
            borderColor: '#003468',
            color: '#003468',
            '&:hover': {
              backgroundColor: '#f0f0f0',
              borderColor: '#002954',
            },
          }}
        >
          Tiếp tục mua sắm
        </Button>
      </Box>
    </MainLayout>
  );
};

export default OrderSuccess;
