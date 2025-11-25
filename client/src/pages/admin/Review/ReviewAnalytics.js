import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axiosInstance from '../../../api/axiosInstance';

const ReviewAnalytics = () => {
  const [period, setPeriod] = useState('all');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
  };

  const fetchSentimentStats = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axiosInstance.get('/admin/reviews/sentiment-stats', {
        params: { period },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(response.data.stats || []);
    } catch (error) {
      console.error('Error fetching sentiment stats:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentStats();
  }, [period]);

  // Tính tổng cảm xúc toàn bộ
  const getTotalSentiment = () => {
    const total = { POS: 0, NEG: 0, NEU: 0, totalReviews: 0 };
    stats.forEach((stat) => {
      total.POS += stat.sentiment_count.POS;
      total.NEG += stat.sentiment_count.NEG;
      total.NEU += stat.sentiment_count.NEU;
      total.totalReviews += stat.total_reviews;
    });

    return {
      ...total,
      POS_PCT: total.totalReviews > 0 ? Math.round((total.POS / total.totalReviews) * 100) : 0,
      NEG_PCT: total.totalReviews > 0 ? Math.round((total.NEG / total.totalReviews) * 100) : 0,
      NEU_PCT: total.totalReviews > 0 ? Math.round((total.NEU / total.totalReviews) * 100) : 0,
    };
  };

  const totalSentiment = getTotalSentiment();

  // Dữ liệu biểu đồ tổng hợp cảm xúc
  const pieData = [
    { name: 'Tích cực', value: totalSentiment.POS, color: '#4caf50' },
    { name: 'Tiêu cực', value: totalSentiment.NEG, color: '#f44336' },
    { name: 'Trung tính', value: totalSentiment.NEU, color: '#ff9800' },
  ].filter((d) => d.value > 0);

  // Dữ liệu biểu đồ cột theo sản phẩm
  const barData = stats.slice(0, 10).map((stat) => ({
    name: stat.product_name.substring(0, 20),
    'Tích cực': stat.sentiment_count.POS,
    'Tiêu cực': stat.sentiment_count.NEG,
    'Trung tính': stat.sentiment_count.NEU,
  }));

  const getSentimentColor = (value) => {
    if (value > 50) return '#4caf50';
    if (value > 20) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 Thống Kê Cảm Xúc Đánh Giá
      </Typography>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: '150px' }} size="small">
          <InputLabel>Thời kỳ</InputLabel>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Thời kỳ">
            <MenuItem value="all">Tất cả thời gian</MenuItem>
            <MenuItem value="day">Hôm nay</MenuItem>
            <MenuItem value="week">Tuần này</MenuItem>
            <MenuItem value="month">Tháng này</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Tổng Đánh Giá
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
              {totalSentiment.totalReviews}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              ✅ Tích Cực
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
              {totalSentiment.POS_PCT}%
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              ({totalSentiment.POS} reviews)
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              ❌ Tiêu Cực
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
              {totalSentiment.NEG_PCT}%
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              ({totalSentiment.NEG} reviews)
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              ➖ Trung Tính
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
              {totalSentiment.NEU_PCT}%
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              ({totalSentiment.NEU} reviews)
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Pie Chart */}
        <Card>
          <CardHeader title="📈 Phân Bố Cảm Xúc" />
          <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="textSecondary">Chưa có dữ liệu</Typography>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader title="🏆 Top 10 Sản Phẩm Được Đánh Giá" />
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Tích cực" stackId="a" fill="#4caf50" />
                  <Bar dataKey="Tiêu cực" stackId="a" fill="#f44336" />
                  <Bar dataKey="Trung tính" stackId="a" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="textSecondary">Chưa có dữ liệu</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Table Chi Tiết */}
      <Card>
        <CardHeader title="📋 Chi Tiết Theo Sản Phẩm" />
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>
                  <strong>Sản Phẩm</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Tổng Reviews</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Avg Rating</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>✅ Tích Cực</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>❌ Tiêu Cực</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>➖ Trung Tính</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">Không có dữ liệu</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((stat) => (
                  <TableRow key={stat.product_id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: '500',
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {stat.product_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={stat.total_reviews} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {stat.avg_rating} ⭐
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                          {stat.sentiment_count.POS}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }}>
                          ({stat.sentiment_percentage.POS}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                          {stat.sentiment_count.NEG}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }}>
                          ({stat.sentiment_percentage.NEG}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                          {stat.sentiment_count.NEU}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#999', fontSize: '12px' }}>
                          ({stat.sentiment_percentage.NEU}%)
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ReviewAnalytics;
