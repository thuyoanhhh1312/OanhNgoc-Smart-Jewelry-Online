import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
} from '@mui/material';
import MainLayout from '../layout/MainLayout';
import goldPriceApi from '../api/goldPriceApi';

const GoldPricePage = () => {
  const [goldPrices, setGoldPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('TP.HCM');

  useEffect(() => {
    fetchGoldPrices();
  }, [location]);

  const fetchGoldPrices = async () => {
    try {
      setLoading(true);
      const response = await goldPriceApi.getGoldPrices(location);
      console.log('Gold prices response:', response.data);
      setGoldPrices(response.data?.data || []);
    } catch (error) {
      console.error('Lỗi lấy giá vàng:', error);
      setGoldPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          💰 Giá Vàng Hôm Nay
        </Typography>

        {/* Filter theo địa điểm */}
        <FormControl sx={{ mb: 3, minWidth: 200 }}>
          <InputLabel>Chọn địa điểm</InputLabel>
          <Select
            value={location}
            label="Chọn địa điểm"
            onChange={(e) => setLocation(e.target.value)}
          >
            <MenuItem value="TP.HCM">TP.HCM</MenuItem>
            <MenuItem value="Hà Nội">Hà Nội</MenuItem>
            <MenuItem value="Đà Nẵng">Đà Nẵng</MenuItem>
          </Select>
        </FormControl>

        {/* Bảng giá */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#003468' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Loại Vàng</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Độ Tinh Khiết
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Giá Mua (đ/chỉ)
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                    Giá Bán (đ/chỉ)
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Chênh Lệch
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {goldPrices.length > 0 ? (
                  goldPrices.map((item) => {
                    const diff = item.sell_price - item.buy_price;
                    return (
                      <TableRow key={item.gold_price_id} hover>
                        <TableCell fontWeight="bold">{item.gold_type}</TableCell>
                        <TableCell align="right">{item.purity}</TableCell>
                        <TableCell align="right" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                          {formatPrice(item.buy_price)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#F44336', fontWeight: 'bold' }}>
                          {formatPrice(item.sell_price)}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                          +{formatPrice(diff)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      Không có dữ liệu giá vàng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="body2" color="text.secondary" mt={2}>
          ℹ️ Cập nhật lúc: {new Date().toLocaleString('vi-VN')}
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default GoldPricePage;
