## **Tóm tắt quy trình chạy**

1. **Mở terminal**, cd vào `nlp-service`
2. `python -m venv venv` // tạo môi trường ảo Python
3. `venv\Scripts\activate` // kích hoạt môi trường ảo
4. `pip install -r requirements.txt`
5. `uvicorn sentiment_api:app --reload --host 0.0.0.0 --port 5001` //Chạy API server với Uvicorn

## **Tính năng chính**

### 1. **Sentiment Analysis** (Phân tích cảm xúc)

- **Model**: mr4/phobert-base-vi-sentiment-analysis (PhoBERT)
- **Output**:
  - `POS` (Tích cực/Dương tính)
  - `NEG` (Tiêu cực/Âm tính)
  - `NEU` (Trung tính)
- **Confidence Score**: Điểm tin cậy từ 0.0 - 1.0

### 2. **Meta-Review Detection** (Phát hiện review "meta")

Tự động phát hiện và phân loại các review **KHÔNG** nên dùng trong thống kê sentiment:

**Meta-review là:**

- 📌 Nói lại ý kiến người khác: _"Nghe người kia bảo tệ nhưng mình thấy họ dìm hàng"_
- 📌 Nhận xét về review khác: _"Review kia chê quá đà"_, _"Bình luận này không sự thật"_
- 📌 Tranh luận/so sánh với review khác: _"Tôi không đồng ý với anh ta"_

**Khi phát hiện meta-review:**

- Tự động trả về `label_code: "UNCLASSIFIED"`
- Hiển thị `label_display: "Không phân loại"`
- **Không được tính vào thống kê sentiment của sản phẩm**

---

## **API Response Format**

### **Review chuẩn (Đánh giá trực tiếp sản phẩm)**

```json
{
  "label": "POS", // Nhãn: POS, NEG, NEU
  "label_display": "Tích cực", // Hiển thị tiếng Việt: Tích cực, Tiêu cực, Trung tính
  "label_code": "POS", // Mã nhãn (giống label)
  "is_meta_review": false,
  "confidence": 0.92, // Độ tin cậy từ PhoBERT (0.0 - 1.0)
  "meta_confidence": 0.05, // Độ tin cậy phát hiện meta (0.0 - 1.0)
  "use_for_stats": true // ✅ Dùng cho thống kê
}
```

### **Meta-Review (Tranh luận / Nói về review khác)**

```json
{
  "label": "UNC",
  "label_display": "Không phân loại",
  "label_code": "UNC",
  "is_meta_review": true,
  "confidence": null, // Không chạy PhoBERT
  "meta_confidence": 0.75, // Độ tin cậy phát hiện meta-review
  "use_for_stats": false, // ❌ Không dùng cho thống kê
  "reason": "Meta-review: Nói về review khác hoặc tranh luận, không phải đánh giá sản phẩm"
}
```

---

## **cURL Sample: import vào Postman để test**

### **Case 1: Tích cực (Review chuẩn)**

```bash
curl --location 'http://localhost:5001/sentiment' \
--header 'Content-Type: application/json' \
--data '{
  "text": "Sản phẩm tuyệt vời, chất lượng tốt, giao hàng nhanh. Tôi rất hài lòng!"
}'
```

**Kỳ vọng**:

- `label: "POS"`, `is_meta_review: false`
- `use_for_stats: true` ✅

### **Case 2: Tiêu cực (Review chuẩn)**

```bash
curl --location 'http://localhost:5001/sentiment' \
--header 'Content-Type: application/json' \
--data '{
  "text": "Tôi rất thất vọng về sản phẩm này. Chất lượng kém, rẻ tiền nhưng không giá trị gì."
}'
```

**Kỳ vọng**:

- `label: "NEG"`, `is_meta_review: false`
- `use_for_stats: true` ✅

### **Case 3: Trung tính (Review chuẩn)**

```bash
curl --location 'http://localhost:5001/sentiment' \
--header 'Content-Type: application/json' \
--data '{
  "text": "Chất lượng bình thường."
}'
```

**Kỳ vọng**:

- `label: "NEU"`, `is_meta_review: false`
- `use_for_stats: true` ✅

### **Case 4: Meta-Review (Nói lại ý người khác)**

```bash
curl --location 'http://localhost:5001/sentiment' \
--header 'Content-Type: application/json' \
--data '{
  "text": "Nghe người kia bảo sản phẩm tệ nhưng mình thấy họ đang dìm hàng. Sản phẩm của mình dùng tốt lắm."
}'
```

**Kỳ vọng**:

- `label: "UNC"`, `label_display: "Không phân loại"`, `is_meta_review: true`
- `confidence: null`, `use_for_stats: false` ❌

### **Case 5: Meta-Review (Nhận xét về review khác)**

```bash
curl --location 'http://localhost:5001/sentiment' \
--header 'Content-Type: application/json' \
--data '{
  "text": "Review kia chê quá đà. Theo mình thì anh ta đang giả tạo lại."
}'
```

**Kỳ vọng**:

- `label: "UNC"`, `label_display: "Không phân loại"`, `is_meta_review: true`
- `confidence: null`, `use_for_stats: false` ❌

### **Case 6: Meta-Review (Tranh luận)**

```bash
curl --location 'http://localhost:5001/sentiment' \
--header 'Content-Type: application/json' \
--data '{
  "text": "Tôi không đồng ý với bạn. Bạn nói tệ quá đà."
}'
```

**Kỳ vọng**:

- `label: "UNC"`, `label_display: "Không phân loại"`, `is_meta_review: true`
- `confidence: null`, `use_for_stats: false` ❌

---

## **Health Check**

```bash
curl --location 'http://localhost:5001/health'
```

Response:

```json
{
  "status": "ok",
  "model": "mr4/phobert-base-vi-sentiment-analysis"
}
```
