// Các lý do hợp lệ để ẩn review (vi phạm chính sách)
export const VALID_HIDE_REASONS = {
  OFFENSIVE_LANGUAGE: {
    value: "offensive_language",
    label: "Chửi tục, xúc phạm cá nhân",
    description: "Chứa từ ngữ thô tục, lời chửi rủa, xúc phạm cá nhân",
  },
  SPAM_ADVERTISING: {
    value: "spam_advertising",
    label: "Spam / Quảng cáo chỗ khác",
    description:
      "Nội dung quảng cáo sản phẩm khác, liên kết ngoài, yêu cầu liên hệ",
  },
  SENSITIVE_CONTENT: {
    value: "sensitive_content",
    label: "Nội dung nhạy cảm (chính trị, tôn giáo, tình dục)",
    description:
      "Nội dung liên quan chính trị, tôn giáo, hoặc nội dung không phù hợp",
  },
  OFF_TOPIC: {
    value: "off_topic",
    label: "Không liên quan đến sản phẩm",
    description:
      "Nội dung không liên quan hoặc không phải feedback về sản phẩm",
  },
  FAKE_REVIEW: {
    value: "fake_review",
    label: "Đánh giá giả mạo / không thật",
    description:
      "Phát hiện dấu hiệu review giả mạo, không phải khách hàng thực",
  },
};

// Các lý do KHÔNG được phép ẩn (feedback hợp lệ dù tiêu cực)
export const INVALID_HIDE_REASONS_EXAMPLES = [
  "Hàng xấu",
  "Đóng gói sơ sài",
  "Ship lâu quá",
  "Giá đắt",
  "Chất lượng không như mong đợi",
  "Không được như hình",
  "Giao hàng chậm",
  "Dịch vụ khách hàng tệ",
];

export const VALID_HIDE_REASON_VALUES = Object.values(VALID_HIDE_REASONS).map(
  (r) => r.value
);
