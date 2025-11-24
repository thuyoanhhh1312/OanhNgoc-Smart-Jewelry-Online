from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, RobertaForSequenceClassification
import torch
import re
from typing import Dict, Tuple

# Khởi tạo FastAPI app
app = FastAPI()

# Load PhoBERT Sentiment model
tokenizer = AutoTokenizer.from_pretrained("mr4/phobert-base-vi-sentiment-analysis", use_fast=False)
model = RobertaForSequenceClassification.from_pretrained("mr4/phobert-base-vi-sentiment-analysis")

# Label mapping: PhoBERT returns [0: NEG, 1: POS, 2: NEU]
label_map = {0: "NEG", 1: "POS", 2: "NEU"}
label_display = {
    0: "Tiêu cực", 
    1: "Tích cực", 
    2: "Trung tính",
    "UNC": "Không phân loại"  # Unclassified (meta-review)
}

class SentimentRequest(BaseModel):
    text: str

def detect_meta_review(text: str) -> Tuple[bool, float]:
    """
    Phát hiện review là meta-review (nói về review khác, tranh luận, không nói trực tiếp về sản phẩm)
    
    Logic:
    - STRONG patterns: Nói về review/người khác, tranh luận, rõ ràng là meta
    - WEAK patterns: Từ khóa tiêu cực chung (loại bỏ, gây nhầm lẫn với review chê thật)
    
    Trả về: (is_meta_review, confidence_score)
    """
    # STRONG patterns: Rõ ràng là meta-review
    strong_patterns = [
        # Nói lại ý kiến người khác - flexible
        r"(nghe|thấy|nghe thấy)\s+.{1,20}?\s+(bảo|nói|nói rằng|kể)",  # "nghe bạn kia bảo...", "nghe người đó nói..."
        r"(theo|như)\s+.{1,20}?\s+(nói|bảo|kể)",  # "theo bạn nói..."
        r"mọi người\s+(nói|bảo|kể)",  # "mọi người nói..."
        r"(anh|chị|bạn|người)\s+.{1,10}?\s+(bảo|nói)",  # "bạn kia nói", "anh ta bảo"
        
        # Nhận xét về review khác - rõ ràng
        r"(review|bình luận|comment|đánh giá)\s+.{1,15}?\s+(chê|khen|tốt|tệ|hay|dở)",  # "review kia chê quá"
        r"(review|bình luận|comment)\s+(này|kia|khác)",  # "review này/kia..."
        r"(bài\s+review|review\s+này|comment\s+này)",  # "bài review này..."
        
        # Tranh luận, không nói trực tiếp
        r"(tôi|mình)\s+(không\s+)?đồng\s*ý",  # "tôi không đồng ý..."
        r"(tôi|mình)\s+không\s+(tin|tin vào)",  # "mình không tin..."
        r"(anh|chị|bạn|người|reviewer)\s+.{1,10}?\s+(sai|nói sai|hiểu sai|dìm|che|giấu|nói dối)",  # "anh ta nói sai", "dìm hàng"
        r"(dìm hàng|nói dối|giả tạo)",  # Direct keywords
        
        # Meta comment về chính bài review
        r"(giả\s+tạo|fake|không\s+sự\s+thật|không\s+thật)",  # "giả tạo", "fake"
        r"(bạn\s+)?sai\b|bạn\s+nói\s+sai",  # "bạn sai", "bạn nói sai"
        r"(tính\s+)?dim\s+hàng",  # "dim hàng", "có tính dim hàng"
    ]
    
    text_lower = text.lower()
    strong_matched = 0
    
    for pattern in strong_patterns:
        if re.search(pattern, text_lower):
            strong_matched += 1
    
    # Tính confidence dựa trên STRONG patterns
    # Nếu match ≥ 1 strong pattern → là meta-review
    confidence = min(strong_matched / max(len(strong_patterns), 1), 1.0)
    is_meta = strong_matched >= 1  # Chỉ cần 1 strong pattern
    
    return is_meta, confidence

def normalize_sentiment_label(label: str) -> str:
    """
    Chuẩn hóa nhãn sentiment để đồng bộ với code phía server
    """
    if label == "POS":
        return "POS"
    elif label == "NEG":
        return "NEG"
    else:
        return "NEU"

@app.post("/sentiment")
def analyze_sentiment(req: SentimentRequest):
    """
    Phân tích sentiment của nội dung review
    
    Cách A (Optimal):
    1. Phát hiện meta-review TRƯỚC → Không chạy PhoBERT, return UNCLASSIFIED ngay
    2. Nếu review chuẩn → Chạy PhoBERT → Return POS/NEG/NEU
    
    Response:
    {
        "label": "POS" | "NEG" | "NEU" | "UNCLASSIFIED",
        "label_display": "Tích cực" | "Tiêu cực" | "Trung tính" | "Không phân loại",
        "label_code": "POS" | "NEG" | "NEU" | "UNCLASSIFIED",
        "is_meta_review": true/false,
        "confidence": 0.0-1.0 (null/0.0 nếu meta),
        "meta_confidence": 0.0-1.0,
        "use_for_stats": true/false
    }
    """
    try:
        # 1. TRƯỚC TIÊN: Phát hiện meta-review
        is_meta_review, meta_confidence = detect_meta_review(req.text)
        
        # 2. Nếu là meta-review (matched ≥ 1 strong pattern) → Return UNCLASSIFIED ngay
        # Không cần threshold cao, chỉ cần 1 strong pattern là đủ để coi là meta
        if is_meta_review:
            return {
                "label": "UNC",
                "label_display": "Không phân loại",
                "label_code": "UNC",
                "is_meta_review": True,
                "confidence": None,
                "meta_confidence": float(meta_confidence),
                "use_for_stats": False,
                "reason": "Meta-review: Nói về review khác hoặc tranh luận, không phải đánh giá sản phẩm"
            }
        
        # 3. Review chuẩn → Chạy PhoBERT
        inputs = tokenizer(req.text, return_tensors="pt", truncation=True, padding=True, max_length=256)
        with torch.no_grad():
            logits = model(**inputs).logits
            # Tính softmax để lấy confidence
            probs = torch.nn.functional.softmax(logits, dim=-1)
            confidence = probs.max().item()
            pred = torch.argmax(logits, dim=1).item()
            
        label = label_map[pred]
        label_code = normalize_sentiment_label(label)
        label_text = label_display.get(label_code, "Trung tính")
        
        return {
            "label": label_code,  # POS, NEG, NEU
            "label_display": label_text,  # Tích cực, Tiêu cực, Trung tính
            "label_code": label_code,
            "is_meta_review": False,
            "confidence": float(confidence),
            "meta_confidence": float(meta_confidence),
            "use_for_stats": True  # Review chuẩn, dùng cho thống kê
        }
    
    except Exception as e:
        return {
            "label": "UNC",
            "label_display": "Không phân loại",
            "label_code": "UNC",
            "is_meta_review": False,
            "confidence": None,
            "meta_confidence": 0.0,
            "use_for_stats": False,
            "error": str(e)
        }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "model": "mr4/phobert-base-vi-sentiment-analysis"}