## **Tóm tắt quy trình chạy**

1. **Mở terminal**, cd vào `nlp-service`
2. `python -m venv venv` // tạo môi trường ảo Python
3. `venv\Scripts\activate` // kích hoạt môi trường ảo
4. `pip install -r requirements.txt`
5. `uvicorn main:app --reload --host 0.0.0.0 --port 5002` //Chạy API server với Uvicorn

## **Tính năng chính**

### 0. **4-Layer Review Processing Pipeline** ⭐ NEW

Quy trình xử lý review tự động với 4 lớp kiểm tra tuần tự:

```
Review Input → L1 (Toxic Filter) → L2 (Product Review?) → L3 (Meta-review?) → L4 (Sentiment)
                 ↓                     ↓                      ↓                   ↓
             BLOCK/SOFT_FLAG      REJECT/PASS            REJECT/PASS        POS/NEG/NEU
```

**Lớp 1: Toxic Filter (Phát hiện nội dung độc hại)**

    Sử dụng unitary/toxic-bert + regex tiếng Việt
    Kiểm tra:
      Threat / Discrimination → BLOCK (chặn ngay)
      Từ tục tĩu / obscene → BLOCK
      Insult / lăng mạ → SOFT_FLAG (gửi admin duyệt)
      Toxic score cao (mild/severe) → SOFT_FLAG hoặc BLOCK tùy ngưỡng
    Input: toxic_scores từ Toxic-BERT
    Output: { status, reason, toxic_categories, toxic_scores }

**Lớp 2: Product Review Classifier (Phân biệt review vs spam/QA)**

Dùng regex để phân biệt:
SPAM: chứa contact, quảng cáo, link, v.v.
QA: câu hỏi, “giá bao nhiêu?”, “có ship không?”,…
DISCUSSION: nói chung chung, không rõ là review
PRODUCT_REVIEW: có từ khóa sản phẩm / cảm xúc (khen/chê)
Output:
status: PASS | REJECT
category: "PRODUCT_REVIEW" | "SPAM" | "QA" | "DISCUSSION"

**Lớp 3: Meta-Review Filter (Lưới an toàn)**
Phát hiện meta-review: nói về review khác chứ không đánh giá sản phẩm:
“Review kia chê quá đà…”
“Tôi không đồng ý với bình luận trên…”
Output:
status: PASS | REJECT
category: "PRODUCT_REVIEW" | "META_REVIEW"

**Lớp 4: Sentiment Analysis (PhoBERT)**
Model: mr4/phobert-base-vi-sentiment-analysis
Dùng trong 2 chế độ:
Standalone: gọi trực tiếp /sentiment → trả về { label, score }
Trong pipeline: /analyze → PhoBERT output được gói trong sentiment_info
Nhãn:
POS – Tích cực
NEG – Tiêu cực
NEU – Trung tính
Lớp 4 chỉ thực sự có ý nghĩa khi review đã qua L1–L3 (sạch / an toàn).
**Final Decision Logic:**

```
  L1 BLOCK            → BLOCKED (ẩn, không publish)
  L1 SOFT_FLAG        → SOFT_FLAG (admin review, ẩn)
  L2 REJECT           → ADMIN_REVIEW (queue: L2_SPAM)
  L3 REJECT           → ADMIN_REVIEW (queue: L3_META_REVIEW)
  L4 NEG + INSULT     → SOFT_FLAG (queue: L4_NEGATIVE_WITH_INSULT)
  All PASS            → APPROVED (publish, tính stats)
```

---

### 1. **Sentiment Analysis** (Phân tích cảm xúc)

- **Model**: mr4/phobert-base-vi-sentiment-analysis (PhoBERT)
- **Port**: 5001
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

### 3. **Toxic Detection** (Phát hiện nội dung độc hại) ⭐ NEW

- **Model**: unitary/toxic-bert (BERT-base-uncased)
- **Port**: 5002
- **Labels** (6 loại):
  - `toxic` - Bình luận độc hại chung
  - `severe_toxic` - Độc hại nghiêm trọng ⚠️
  - `obscene` - Không phù hợp/tục tĩu
  - `threat` - Đe dọa ⚠️
  - `insult` - Nhục mạ
  - `identity_hate` - Kỳ thị danh tính
- **Threshold**: 0.5 (auto-flag cho admin review nếu > 0.5)
- **Output**: Điểm độc hại, loại phát hiện, lý do chi tiết

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
curl --location 'http://localhost:5002/sentiment' \
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
curl --location 'http://localhost:5002/sentiment' \
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
curl --location 'http://localhost:5002/sentiment' \
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
curl --location 'http://localhost:5002/sentiment' \
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
curl --location 'http://localhost:5002/sentiment' \
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
curl --location 'http://localhost:5002/sentiment' \
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
curl --location 'http://localhost:5002/health'
```

Response:

```json
{
  "status": "ok",
  "model": "mr4/phobert-base-vi-sentiment-analysis"
}
```

---

## **Test Results: 4-Layer Pipeline** ✅

```
[TEST 1] Insult + bad service
Text: Độ ngu, bán hàng như các vây cùng mở shop
Status: SOFT_FLAG
Queue: L1_INSULT_DETECTED
Layers: L1(SOFT_FLAG) → L2(PASS) → L3(PASS)

[TEST 2] Pure praise
Text: Sản phẩm tuyệt vời, giao hàng nhanh, nhân viên tốt bụng
Status: SOFT_FLAG
Queue: L1_SOFT_FLAG_TOXIC
Layers: L1(SOFT_FLAG) → L2(PASS) → L3(PASS)

[TEST 3] Threat ⚠️
Text: Sẽ kiện bạn ngay, đừng có bán hàng nữa
Status: BLOCKED
Queue: L1_SEVERE_TOXIC
Layers: L1(BLOCK) → END

[TEST 4] Spam contact
Text: Liên hệ tôi tại 0123456789, mua hàng ở đây
Status: ADMIN_REVIEW
Queue: L2_SPAM
Layers: L1(SOFT_FLAG) → L2(REJECT) → END

[TEST 5] Meta-review
Text: Cái review này nói đúng, nó tệ quá
Status: ADMIN_REVIEW
Queue: L3_META_REVIEW
Layers: L1(SOFT_FLAG) → L2(PASS) → L3(REJECT) → END
```

**Kết quả:** Tất cả test cases ✅ hoạt động đúng theo design!
