import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Rating,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import axiosInstance from '../../../api/axiosInstance';
import ReviewAnalytics from './ReviewAnalytics';

const ReviewManagement = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [negativeReviews, setNegativeReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Filter states
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Get token from localStorage
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
  };

  // Load all reviews
  useEffect(() => {
    fetchAllReviews();
    fetchNegativeReviews();
  }, []);

  // Apply filters whenever reviews or filter state changes
  useEffect(() => {
    applyFilters(reviews);
  }, [reviews, filterSentiment, filterRating, searchText]);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axiosInstance.get('/admin/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedReviews = response.data.reviews || [];
      setReviews(fetchedReviews);
      console.log('Fetched reviews from API:', fetchedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNegativeReviews = async () => {
    try {
      const token = getAuthToken();
      const response = await axiosInstance.get('/admin/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allReviews = response.data.reviews || [];
      const negative = allReviews.filter((r) => r.sentiment === 'NEG');
      setNegativeReviews(negative);
    } catch (error) {
      console.error('Error fetching negative reviews:', error);
      setNegativeReviews([]);
    }
  };

  const applyFilters = (reviewList) => {
    let filtered = reviewList;

    if (filterSentiment !== 'all') {
      filtered = filtered.filter((r) => r.sentiment === filterSentiment);
    }

    if (filterRating !== 'all') {
      filtered = filtered.filter((r) => r.rating === parseInt(filterRating));
    }

    if (searchText) {
      filtered = filtered.filter(
        (r) =>
          r.content.toLowerCase().includes(searchText.toLowerCase()) ||
          r.Customer?.name.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    setFilteredReviews(filtered);
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POS':
        return 'success';
      case 'NEG':
        return 'error';
      case 'NEU':
        return 'warning';
      case 'UNC':
        return 'info'; // Xanh dương cho "Không phân loại"
      default:
        return 'default';
    }
  };

  const getSentimentLabel = (sentiment) => {
    const map = {
      POS: 'Tích cực',
      NEG: 'Tiêu cực',
      NEU: 'Trung tính',
      UNC: 'Không phân loại',
    };
    return map[sentiment] || 'Chưa phân tích';
  };

  const handleOpenDetail = (review) => {
    setSelectedReview(review);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedReview(null);
    setHideReason('');
  };

  const renderReviewsTable = (reviewsList) => (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Tìm kiếm (nội dung/khách hàng)"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: '200px' }}
        />

        <FormControl sx={{ minWidth: '120px' }} size="small">
          <InputLabel>Cảm xúc</InputLabel>
          <Select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            label="Cảm xúc"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="POS">Tích cực</MenuItem>
            <MenuItem value="NEG">Tiêu cực</MenuItem>
            <MenuItem value="NEU">Trung tính</MenuItem>
            <MenuItem value="UNC">Không phân loại (Meta)</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: '100px' }} size="small">
          <InputLabel>Rating</InputLabel>
          <Select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            label="Rating"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="5">5 sao</MenuItem>
            <MenuItem value="4">4 sao</MenuItem>
            <MenuItem value="3">3 sao</MenuItem>
            <MenuItem value="2">2 sao</MenuItem>
            <MenuItem value="1">1 sao</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={fetchAllReviews}>
          🔄 Làm mới
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>
                <strong>Khách hàng</strong>
              </TableCell>
              <TableCell>
                <strong>Sản phẩm</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Rating</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Sentiment</strong>
              </TableCell>
              <TableCell>
                <strong>Nội dung</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Hành động</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviewsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">Không có đánh giá nào</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reviewsList.map((review) => (
                <TableRow
                  key={review.review_id}
                  sx={{
                    backgroundColor: review.is_suspicious ? '#fff3cd' : 'transparent',
                    '&:hover': { backgroundColor: '#f9f9f9' },
                  }}
                >
                  <TableCell>{review.Customer?.name || 'Ẩn danh'}</TableCell>
                  <TableCell>{review.Product?.product_name || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Rating value={review.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getSentimentLabel(review.sentiment)}
                      color={getSentimentColor(review.sentiment)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: '200px' }}>
                    <Typography
                      variant="body2"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {review.content}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      onClick={() => handleOpenDetail(review)}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 Quản Lý Đánh Giá Sản Phẩm
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label={`📋 Tất Cả (${reviews.length})`} />
          <Tab label={`❌ Tiêu Cực (${negativeReviews.length})`} />
          <Tab label="📈 Thống Kê" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderReviewsTable(filteredReviews)}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            ❌ Reviews Tiêu Cực - Cần Xử Lý
          </Typography>
          {negativeReviews.length === 0 ? (
            <Typography color="textSecondary">Không có reviews tiêu cực</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#fff3cd' }}>
                  <TableRow>
                    <TableCell>
                      <strong>Khách hàng</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Sản phẩm</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Rating</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nội dung</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Hành động</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {negativeReviews.map((review) => (
                    <TableRow key={review.review_id} sx={{ backgroundColor: '#fffbea' }}>
                      <TableCell>{review.Customer?.name || 'Ẩn danh'}</TableCell>
                      <TableCell>{review.Product?.product_name || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Rating value={review.rating} readOnly size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: '250px' }}>
                        <Typography variant="body2">{review.content}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => handleOpenDetail(review)}
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {activeTab === 2 && <ReviewAnalytics />}

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>📋 Chi tiết đánh giá</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedReview && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Khách hàng
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {selectedReview.Customer?.name || 'Ẩn danh'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Sản phẩm
                </Typography>
                <Typography variant="body1">
                  {selectedReview.Product?.product_name || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Rating
                </Typography>
                <Rating value={selectedReview.rating} readOnly size="medium" />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Sentiment (PhoBERT)
                </Typography>
                <Chip
                  label={getSentimentLabel(selectedReview.sentiment)}
                  color={getSentimentColor(selectedReview.sentiment)}
                  variant="outlined"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Nội dung
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, whiteSpace: 'pre-wrap' }}
                >
                  {selectedReview.content}
                </Typography>
              </Box>

              {selectedReview.is_suspicious && (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: '#fff3cd',
                    borderRadius: 1,
                    borderLeft: '4px solid #ffc107',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ⚠️ Cảnh báo: Review khả nghi
                  </Typography>
                  <Typography variant="body2">
                    {selectedReview.suspicious_reason || 'Rating và sentiment không khớp'}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Ngày đánh giá
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedReview.created_at).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewManagement;
