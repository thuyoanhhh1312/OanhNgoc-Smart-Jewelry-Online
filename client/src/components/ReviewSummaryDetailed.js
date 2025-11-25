import React from 'react';

const ReviewSummaryDetailed = ({ summary }) => {
  if (!summary?.data) {
    return <div className="text-center text-gray-400">Đang tải...</div>;
  }

  const { sentiment = {}, rating = {}, suspicious = {}, overall = {} } = summary.data;
  const total = overall?.totalReviews || 0;

  const getPercent = (count) => (total > 0 ? ((count / total) * 100).toFixed(1) : 0);

  const getSentimentColor = (type) => {
    switch (type) {
      case 'POS':
        return 'text-green-600';
      case 'NEG':
        return 'text-red-600';
      case 'NEU':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };

  const getSentimentLabel = (type) => {
    switch (type) {
      case 'POS':
        return 'Tích cực';
      case 'NEG':
        return 'Tiêu cực';
      case 'NEU':
        return 'Trung tính';
      default:
        return 'Chưa phân loại';
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: TỔNG QUAN */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-4">📊 TỔNG QUAN</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded text-center">
            <div className="text-3xl font-bold text-yellow-500">
              ★ {overall?.avgRating?.toFixed(1) || 0}
            </div>
            <p className="text-sm text-gray-600">/5</p>
          </div>
          <div className="bg-white p-4 rounded text-center">
            <div className="text-3xl font-bold text-blue-600">{total}</div>
            <p className="text-sm text-gray-600">Đánh giá</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ĐÁNH GIÁ SAO */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-yellow-900 mb-4">⭐ ĐÁNH GIÁ SAO</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = rating?.[star] || 0;
            const percent = getPercent(count);
            return (
              <div key={star} className="flex items-center gap-3">
                <div className="w-12 text-sm font-semibold text-gray-700">
                  {star} <span className="text-yellow-400">★</span>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-2 bg-yellow-400 rounded transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm font-bold text-gray-700">
                  {count} ({percent}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: REVIEW KHẢ NGI */}
      {suspicious?.count && suspicious.count > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-red-900 mb-4">
            🚨 REVIEW KHẢ NGI ({suspicious?.count})
          </h3>
          <p className="text-sm text-red-800 mb-4">
            Phát hiện {suspicious?.count} review có dấu hiệu mâu thuẫn giữa rating và nội dung
          </p>
          <div className="space-y-3">
            {suspicious?.reviews &&
              suspicious.reviews.map((review, idx) => (
                <div key={idx} className="bg-white p-4 rounded border-l-4 border-red-500">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">👤 {review.customer}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ⭐ {review.rating} sao | Cảm xúc: {getSentimentLabel(review.sentiment)}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 italic">"{review.content}"</p>
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <p className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded whitespace-nowrap">
                        {review.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSummaryDetailed;
