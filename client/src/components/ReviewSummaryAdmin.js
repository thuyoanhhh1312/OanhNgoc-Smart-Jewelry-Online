import React from 'react';

const ReviewSummaryAdmin = ({ summary }) => {
  if (!summary || !summary.data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Không có dữ liệu đánh giá</p>
      </div>
    );
  }

  const { data } = summary;
  const { overall = {}, sentiment = {}, rating = {}, suspicious = {} } = data;

  const getSentimentColor = (type) => {
    switch (type) {
      case 'POS':
        return 'bg-green-50 border-green-200';
      case 'NEG':
        return 'bg-red-50 border-red-200';
      case 'NEU':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSentimentLabel = (type) => {
    switch (type) {
      case 'POS':
        return { label: 'Tích cực', color: 'text-green-700', bg: 'bg-green-100' };
      case 'NEG':
        return { label: 'Tiêu cực', color: 'text-red-700', bg: 'bg-red-100' };
      case 'NEU':
        return { label: 'Trung tính', color: 'text-yellow-700', bg: 'bg-yellow-100' };
      default:
        return { label: 'Không xác định', color: 'text-gray-700', bg: 'bg-gray-100' };
    }
  };

  const sentimentPercentages = {
    POS:
      overall?.totalReviews > 0
        ? (((sentiment?.POS || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    NEG:
      overall?.totalReviews > 0
        ? (((sentiment?.NEG || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    NEU:
      overall?.totalReviews > 0
        ? (((sentiment?.NEU || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    UNKNOWN:
      overall?.totalReviews > 0
        ? (((sentiment?.UNKNOWN || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
  };

  const ratingPercentages = {
    5:
      overall?.totalReviews > 0
        ? (((rating?.[5] || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    4:
      overall?.totalReviews > 0
        ? (((rating?.[4] || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    3:
      overall?.totalReviews > 0
        ? (((rating?.[3] || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    2:
      overall?.totalReviews > 0
        ? (((rating?.[2] || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
    1:
      overall?.totalReviews > 0
        ? (((rating?.[1] || 0) / overall.totalReviews) * 100).toFixed(1)
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: TỔNG QUAN */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-4">📊 TỔNG QUAN</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Tổng số đánh giá</p>
            <p className="text-3xl font-bold text-blue-600">{overall.totalReviews}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Đánh giá trung bình</p>
            <p className="text-3xl font-bold text-blue-600">{overall.avgRating} ⭐</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: PHÂN TÍCH CẢM XÚC */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-4">
          💭 PHÂN TÍCH CẢM XÚC (từ nội dung)
        </h3>
        <div className="space-y-4">
          {['POS', 'NEG', 'NEU', 'UNKNOWN'].map((type) => {
            const label = getSentimentLabel(type);
            const count = sentiment?.[type] || 0;
            const percentage = sentimentPercentages[type];

            return (
              <div key={type}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-semibold ${label.color}`}>{label.label}</span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${label.bg}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ĐÁNH GIÁ SAO */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg shadow-md p-6 border border-amber-200">
        <h3 className="text-lg font-bold text-amber-900 mb-4">⭐ ĐÁNH GIÁ SAO</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">
                  {'⭐'.repeat(stars)} {stars} sao
                </span>
                <span className="text-sm text-gray-600">
                  {rating?.[stars] || 0} ({ratingPercentages[stars]}%)
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${ratingPercentages[stars]}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: REVIEW KHẢ NGI */}
      {suspicious?.count && suspicious.count > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow-md p-6 border border-red-200">
          <h3 className="text-lg font-bold text-red-900 mb-4">
            ⚠️ REVIEW KHẢ NGI ({suspicious.count})
          </h3>
          <p className="text-sm text-red-700 mb-4">
            {suspicious?.label} - Các đánh giá có mâu thuẫn giữa rating và nội dung
          </p>
          <div className="space-y-3">
            {suspicious?.reviews &&
              suspicious.reviews.map((review, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-red-300">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{review.customer}</p>
                      <p className="text-sm text-gray-600">
                        {'⭐'.repeat(review.rating)} {review.rating} sao
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        review.sentiment === 'POS'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {review.sentiment === 'POS' ? 'Tích cực' : 'Tiêu cực'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">"{review.content}"</p>
                  <p className="text-sm font-semibold text-red-600">🚨 {review.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {(!suspicious || suspicious.count === 0) && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200">
          <p className="text-green-700 font-semibold text-center">
            ✅ Tất cả đánh giá đều hợp lệ - Không có review khả nghi
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewSummaryAdmin;
