import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, Typography, Card, CardContent, Avatar, Divider } from '@mui/material';
import ReactStars from 'react-rating-stars-component';

// Helper component cho nội dung tab panel theo MUI docs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}
TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `review-tab-${index}`,
    'aria-controls': `review-tabpanel-${index}`,
  };
}

const ReviewTabs = ({ reviews }) => {
  const ratingLevels = [5, 4, 3, 2, 1];

  // Chỉ dùng rating tabs, bỏ sentiment tabs
  const tabs = ratingLevels.map((star) => ({
    type: 'rating',
    key: star.toString(),
    title: `${star} sao`,
  }));

  // Lọc review theo rating
  const reviewsByRating = useMemo(() => {
    const map = { 5: [], 4: [], 3: [], 2: [], 1: [] };
    reviews.forEach((r) => {
      if (map[r.rating]) map[r.rating].push(r);
    });
    return map;
  }, [reviews]);

  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Render danh sách review
  const renderReviewList = (reviewList) => {
    if (!reviewList || reviewList.length === 0) {
      return (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ fontSize: '16px' }}>
            😔 Không có đánh giá nào
          </Typography>
        </Box>
      );
    }
    return reviewList.map((item) => (
      <Card
        key={item.review_id}
        sx={{
          mb: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
          borderLeft: '4px solid #ffc107',
        }}
      >
        <CardContent sx={{ pb: 2 }}>
          {/* Header: Avatar + Name + Rating + Date */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: '#ffc107',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                {(item.Customer?.name || 'K')[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: '600', fontSize: '15px' }}>
                  {item.Customer?.name || 'Khách ẩn danh'}
                </Typography>
                <ReactStars
                  count={5}
                  value={item.rating}
                  size={18}
                  edit={false}
                  isHalf={false}
                  activeColor="#ffc107"
                  emptyIcon={<i className="far fa-star"></i>}
                  halfIcon={<i className="fa fa-star-half-alt"></i>}
                  fullIcon={<i className="fa fa-star"></i>}
                />
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: '#999',
                fontSize: '13px',
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
                ml: 2,
              }}
            >
              {new Date(item.created_at).toLocaleDateString('vi-VN')}
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Content */}
          <Typography
            sx={{
              mt: 2,
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#333',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {item.content}
          </Typography>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {/* Tabs Header */}
      <Box
        sx={{
          backgroundColor: '#f5f5f5',
          borderRadius: '8px 8px 0 0',
          p: 1,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Review tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffc107',
              height: '3px',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: '600',
              fontSize: '15px',
              color: '#666',
              '&.Mui-selected': {
                color: '#333',
              },
            },
          }}
        >
          {tabs.map(({ type, key, title }, index) => {
            const count = reviewsByRating[key]?.length || 0;
            return <Tab key={key} label={`${title} (${count})`} {...a11yProps(index)} />;
          })}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '0 0 8px 8px', p: 3 }}>
        {tabs.map(({ type, key }, index) => {
          const list = reviewsByRating[key];
          return (
            <TabPanel key={key} value={tabValue} index={index}>
              {renderReviewList(list)}
            </TabPanel>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReviewTabs;
