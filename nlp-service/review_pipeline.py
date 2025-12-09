"""
4-Layer Review Processing Pipeline

Lớp 1: Toxic Filter (unitary/toxic-bert) - Chặn toxic/hate/threat
Lớp 2: Product Review Classifier - Phân biệt review vs spam/QA
Lớp 3: Meta-review Filter + Admin Queue - Lưới an toàn
Lớp 4: PhoBERT Sentiment - Cảm xúc (chỉ trên dữ liệu sạch)

Pipeline flow:
review → L1 (toxic?) → L2 (product review?) → L3 (meta?) → L4 (sentiment)

Output mỗi lớp:
- status: PASS, BLOCK, SOFT_FLAG, ADMIN_REVIEW
- reason: tại sao lại reject
- data: input cho lớp tiếp theo
"""

from typing import Dict, List, Tuple
import re
import logging

logger = logging.getLogger(__name__)

# ======================== LAYER 1: TOXIC FILTER ========================

class ToxicFilter:
    """Lớp 1: Phát hiện toxic, threat, hate speech"""
    
    # Threshold để quyết định mức độ toxic
    SEVERE_THRESHOLD = 0.8  # Severe toxic / threat → auto block
    MILD_THRESHOLD = 0.3     # Mild toxic → soft flag (hạ xuống từ 0.5 để bắt Toxic-BERT từ English model)
    
    THREAT_KEYWORDS = [
        r"(?:đe\s*dọa|sẽ\s*kiện|sẽ\s*tố\s*cáo|khốn\s*kiếp|chết\s*tiệt)",
        r"(?:địa\s*chỉ|nhà\s*bạn|gia\s*đình|con\s*em).*(?:đến|ghé)",
    ]
    
    # Từ lăng mạ / xúc phạm mạnh trong tiếng Việt
    INSULT_KEYWORDS = [
        r"\bngu\b",
        r"\bngốc\b",
        r"\bđần\b",
        r"\bóc\s*chó\b",
        r"\bvô\s*duyên\b",
        r"\bkém\s*dạy\b",
        r"\bthô\s*lỗ\b",
        r"\bcút\b",
        r"\bđồ\s+khốn\b",
    ]

    
    # Các mẫu lăng mạ dạng cụm + bán hàng tệ
    SERVICE_QUALITY_INSULTS = [
        r"bán\s*hàng\s*(?:tệ|tồi|kinh\s*khủng|như\s*(?:cây|vẫy|\s*cục|x\w*ng))",
        r"chất\s*lượng\s*(?:tệ|tồi|cùm|xoàng|s\w*ch)",
        r"(?:dịch\s*vụ|phục\s*vụ)\s*(?:tệ|tồi|tệp|quá\s*(?:xấu|tệ))",
        r"(?:thằng|con|bố|mẹ)\s*\w*\s*(?:ngu|khop|tệ)",  # Chỉ người
        r"(?:giá|tiền)\s*(?:lừa|cắt\s*cổ|quá\s*(?:mắc|cao))",  # Giá xấu
        r"(?:nhân\s*viên|shop|cửa\s*hàng)\s*(?:tệ|tồi|kém\s*dạy|vô\s*duyên)",
    ]
    
    DISCRIMINATION_PATTERNS = [
        r"(?:tất\s*cả|mọi).*(?:người\s+nước\s+ngoài|khác\s+tôn\s+giáo).*(?:đều|là)\s*(?:xấu|ngu)",
        r"(?:người|dân)\s+(?:nước\s+ngoài|khác\s+tôn\s+giáo).*(?:không\s+tốt|xấu)",
    ]
    OBSCENE_WORDS = [
        r"cặc",
        r"dmm",
        r"cmm",
        r"lồn",
        r"đụ",
        r"mẹ\s*kiếp",
        r"fuck|shit|damn|ass\b",
    ]
    
    @staticmethod
    def check_obscene(text: str) -> Tuple[bool, str]:
        for pattern in ToxicFilter.OBSCENE_WORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "obscene_detected"
        return False, ""
    
    @staticmethod
    def check_threat(text: str) -> Tuple[bool, str]:
        """Kiểm tra đe dọa trực tiếp"""
        for pattern in ToxicFilter.THREAT_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "threat_detected"
        return False, ""
    
    @staticmethod
    def check_insult(text: str) -> Tuple[bool, str]:
        """Kiểm tra lăng mạ tiếng Việt"""
        # Kiểm tra từ lăng mạ đơn
        for pattern in ToxicFilter.INSULT_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "insult_detected"
        
        # Kiểm tra lăng mạ dạng cụm (bán hàng tệ, chất lượng tồi)
        for pattern in ToxicFilter.SERVICE_QUALITY_INSULTS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "service_quality_insult_detected"
        
        return False, ""
    
    @staticmethod
    def check_discrimination(text: str) -> Tuple[bool, str]:
        """Kiểm tra kỳ thị/hate speech"""
        for pattern in ToxicFilter.DISCRIMINATION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "discrimination_detected"
        return False, ""
    
    @staticmethod
    def process(text: str, toxic_scores: Dict) -> Dict:
        """
        Xử lý Layer 1: Toxic Filter
        
        Input:
        - text: nội dung review
        - toxic_scores: {toxic, severe_toxic, obscene, threat, insult, identity_hate}
          (từ unitary/toxic-bert model)
        
        Output:
        {
            "status": "PASS" | "BLOCK" | "SOFT_FLAG",
            "reason": str,
            "layer": 1,
            "toxic_categories": list,
            "toxic_scores": dict
        }
        """
        
        # 1. Check threat / discrimination (hard rule)
        has_threat, threat_reason = ToxicFilter.check_threat(text)
        has_discrimination, disc_reason = ToxicFilter.check_discrimination(text)
        
        if has_threat or has_discrimination:
            return {
                "status": "BLOCK",
                "reason": f"Phát hiện {'đe dọa' if has_threat else 'kỳ thị'} → Chặn ngay",
                "layer": 1,
                "toxic_categories": ["threat" if has_threat else "identity_hate"],
                "toxic_scores": toxic_scores,
                "action": "admin_review"  # Vẫn gửi admin review để có record
            }
         # 1.5 Obscene → HARD BLOCK
        has_obscene, obscene_reason = ToxicFilter.check_obscene(text)
        if has_obscene:
            return {
                "status": "BLOCK",
                "reason": "Phát hiện từ ngữ tục tĩu/obscene → Chặn ngay",
                "layer": 1,
                "toxic_categories": ["obscene"],
                "toxic_scores": toxic_scores,
                "action": "admin_review",
            }
        # 2. Check insult (regex patterns Vietnamese)
        has_insult, insult_reason = ToxicFilter.check_insult(text)
        if has_insult:
            return {
                "status": "SOFT_FLAG",
                "reason": f"Phát hiện lăng mạ tiếng Việt: {insult_reason} → Gửi admin review",
                "layer": 1,
                "toxic_categories": ["insult"],
                "toxic_scores": toxic_scores,
                "action": "admin_review"
            }
        
        # 3. Check severe toxic / obscene (SEVERE_THRESHOLD)
        severe_toxic = toxic_scores.get("severe_toxic", 0)
        threat_score = toxic_scores.get("threat", 0)
        
        if severe_toxic >= ToxicFilter.SEVERE_THRESHOLD or threat_score >= ToxicFilter.SEVERE_THRESHOLD:
            return {
                "status": "BLOCK",
                "reason": "Phát hiện độc hại nặng → Chặn ngay",
                "layer": 1,
                "toxic_categories": [],
                "toxic_scores": toxic_scores,
                "action": "admin_review"
            }
        
        # 3. Check mild toxic (MILD_THRESHOLD)
        toxic = toxic_scores.get("toxic", 0)
        insult = toxic_scores.get("insult", 0)
        obscene = toxic_scores.get("obscene", 0)
        
        if (toxic >= ToxicFilter.MILD_THRESHOLD or 
            insult >= ToxicFilter.MILD_THRESHOLD or 
            obscene >= ToxicFilter.MILD_THRESHOLD):
            return {
                "status": "SOFT_FLAG",
                "reason": "Phát hiện nội dung độc hại → Soft flag",
                "layer": 1,
                "toxic_categories": [k for k, v in toxic_scores.items() if v >= ToxicFilter.MILD_THRESHOLD],
                "toxic_scores": toxic_scores,
                "action": "admin_review"
            }
        
        # 4. Pass L1
        return {
            "status": "PASS",
            "reason": "An toàn - qua L1",
            "layer": 1,
            "toxic_categories": [],
            "toxic_scores": toxic_scores
        }


# ======================== LAYER 2: PRODUCT REVIEW CLASSIFIER ========================

class ProductReviewClassifier:
    """Lớp 2: Phân biệt review sản phẩm vs QA/spam/discussion"""
    
    # Patterns để detect non-review
    QA_PATTERNS = [
        r"(?:hỏi|giúp|bao\s*nhiêu|giá\s*bao\s*nhiêu|làm\s*sao)",
        r"(?:có\s*cái\s*nào|cái\s*nào\s*tốt\s*hơn|nên\s*mua\s*cái\s*nào)",
        r"\?+\s*$",  # Kết thúc bằng dấu ?
    ]
    
    SPAM_PATTERNS = [
        r"(?:liên\s*hệ|zalo|facebook|whatapp|gmail|skype)[\s:=]*[\w\d\-\._@+]+",  # Contact info
        r"(?:mua\s*ở|shop\s*khác|cửa\s*hàng\s*khác)[\s:=]*[\w\d\-\._/]+",  # External shop
        # Removed "bán" pattern to avoid matching "bán hàng như" criticism
    ]
    
    PRODUCT_KEYWORDS = [
        r"(?:sản\s*phẩm|hàng|cái\s*này|chiếc\s*này|đồ\s*này)",
        r"(?:chất\s*lượng|giá|size|màu|mùi|vị|dáng|kiểu)",
        r"(?:tốt|xấu|đẹp|dở|dùng\s*được|bền|rẻ|đắt)",
    ]
    
    @staticmethod
    def process(text: str) -> Dict:
        """
        Xử lý Layer 2: Product Review Classifier
        
        Output:
        {
            "status": "PASS" | "REJECT",
            "category": "PRODUCT_REVIEW" | "QA" | "SPAM" | "DISCUSSION",
            "reason": str,
            "layer": 2,
            "confidence": float
        }
        """
        
        # 1. Check SPAM (highest priority - auto reject)
        for pattern in ProductReviewClassifier.SPAM_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return {
                    "status": "REJECT",
                    "category": "SPAM",
                    "reason": "Phát hiện spam/quảng cáo",
                    "layer": 2,
                    "confidence": 0.95,
                    "action": "admin_review"
                }
        
        # 2. Check QA (strong signal)
        qa_matches = sum(1 for p in ProductReviewClassifier.QA_PATTERNS 
                        if re.search(p, text, re.IGNORECASE | re.UNICODE))
        if qa_matches >= 2:  # Ít nhất 2 pattern match
            return {
                "status": "REJECT",
                "category": "QA",
                "reason": "Phát hiện hỏi đáp / thảo luận, không phải review",
                "layer": 2,
                "confidence": 0.85,
                "action": "admin_review"
            }
        
        # 3. Check PRODUCT_REVIEW (need at least 1 keyword OR has criticism/praise words)
        product_matches = sum(1 for p in ProductReviewClassifier.PRODUCT_KEYWORDS 
                             if re.search(p, text, re.IGNORECASE | re.UNICODE))
        
        # Also check if text has sentiment words (criticism, praise)
        criticism_words = [r"(?:tệ|xấu|kém|tồi|không|chê|chửi)", r"(?:ngu|ngốc|khốn)"]
        praise_words = [r"(?:tốt|đẹp|tuyệt|hay|yêu|thích|quá)"]
        
        has_criticism = any(re.search(p, text, re.IGNORECASE | re.UNICODE) for p in criticism_words)
        has_praise = any(re.search(p, text, re.IGNORECASE | re.UNICODE) for p in praise_words)
        has_sentiment = has_criticism or has_praise
        
        if (product_matches >= 1 or has_sentiment) and qa_matches < 2:
            return {
                "status": "PASS",
                "category": "PRODUCT_REVIEW",
                "reason": "Đúng là review sản phẩm",
                "layer": 2,
                "confidence": 0.75 + (min(product_matches, 2) * 0.1)
            }
        
        # 4. Default: DISCUSSION (không chắc)
        return {
            "status": "REJECT",
            "category": "DISCUSSION",
            "reason": "Không chắc là review sản phẩm → cần admin duyệt",
            "layer": 2,
            "confidence": 0.5,
            "action": "admin_review"
        }


# ======================== LAYER 3: META-REVIEW FILTER + ADMIN QUEUE ========================

class MetaReviewFilter:
    """Lớp 3: Phát hiện meta-review (nói về review khác)"""
    
    STRONG_META_PATTERNS = [
        r"(nghe|thấy|nghe\s+thấy).*?(bảo|nói|kể)",
        r"(theo|như).*?(nói|bảo)",
        r"mọi\s+người.*?(nói|bảo|kể)",
        r"(review|bình\s+luận|comment).*?(chê|khen|tốt|tệ)",
        r"(bài\s+review|review\s+này|comment\s+này)",
        r"(?:không\s+)?đồng\s+ý\s+với.*?(review|bình\s+luận|comment)",
    ]
    
    @staticmethod
    def process(text: str) -> Dict:
        """
        Xử lý Layer 3: Meta-review Filter
        
        Output:
        {
            "status": "PASS" | "REJECT",
            "category": "PRODUCT_REVIEW" | "META_REVIEW",
            "reason": str,
            "layer": 3,
            "confidence": float
        }
        """
        
        meta_matches = sum(1 for p in MetaReviewFilter.STRONG_META_PATTERNS 
                          if re.search(p, text, re.IGNORECASE | re.UNICODE))
        
        if meta_matches >= 1:
            return {
                "status": "REJECT",
                "category": "META_REVIEW",
                "reason": "Phát hiện meta-review (nói về review khác)",
                "layer": 3,
                "confidence": 0.85,
                "action": "admin_review"
            }
        
        return {
            "status": "PASS",
            "category": "PRODUCT_REVIEW",
            "reason": "An toàn - qua L3",
            "layer": 3,
            "confidence": 0.95
        }


class AdminQueue:
    """Hàng chờ admin duyệt"""
    
    ADMIN_REVIEW_REASONS = [
        "TOXIC_SOFT_FLAG",      # L1: Toxic mild
        "SPAM",                  # L2: Spam
        "QA_OR_DISCUSSION",     # L2: QA/Discussion
        "META_REVIEW",          # L3: Meta-review
        "BORDERLINE_TOXIC"      # L1: Borderline toxic
    ]
    
    @staticmethod
    def create_ticket(text: str, layer: int, reason: str, metadata: Dict = None) -> Dict:
        """Tạo ticket admin duyệt"""
        return {
            "text": text,
            "layer": layer,
            "reason": reason,
            "status": "pending",  # pending, approved, rejected, edited
            "metadata": metadata or {},
            "created_at": None,  # Set bởi API
            "reviewed_at": None,
            "reviewer_id": None,
            "reviewer_action": None,  # approved, rejected, edited
            "editor_notes": None
        }


# ======================== LAYER 4: SENTIMENT (PhoBERT) ========================

class SentimentAnalyzer:
    """Lớp 4: PhoBERT sentiment (chỉ chạy trên dữ liệu sạch)"""
    
    @staticmethod
    def process(text: str, phobert_result) -> Dict:
        """
        Xử lý Layer 4: Sentiment
        
        Input:
        - phobert_result: 
          Dict: {label, confidence, ...} từ PhoBERT API
          List: [{label, score}] từ transformers pipeline
        
        Output:
        {
            "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
            "confidence": float,
            "layer": 4,
            "use_for_stats": true
        }
        """
        
        # Handle transformers pipeline output (list format)
        if isinstance(phobert_result, list) and len(phobert_result) > 0:
            phobert_result = phobert_result[0]
        
        # Map Vietnamese labels to English
        label = phobert_result.get("label", "Trung tính")
        confidence = phobert_result.get("score", phobert_result.get("confidence", 0))
        
        # Map Vietnamese labels to code
        label_map = {
            "Tích cực": "POS",
            "Tiêu cực": "NEG",
            "Trung tính": "NEU",
            "POSITIVE": "POS",
            "NEGATIVE": "NEG",
            "NEUTRAL": "NEU",
        }
        
        label_code = label_map.get(label, "NEU")
        
        return {
            "sentiment": label_code,
            "sentiment_display": label,
            "confidence": float(confidence),
            "feedback_type": "neutral",
            "layer": 4,
            "use_for_stats": True
        }


# ======================== PIPELINE ORCHESTRATOR ========================

class ReviewPipeline:
    """Điều phối 4 lớp xử lý"""
    
    @staticmethod
    def process(text: str, toxic_scores: Dict, phobert_result: Dict = None) -> Dict:
        """
        Pipeline chính:
        L1 (Toxic) → L2 (Product Review) → L3 (Meta-review) → L4 (Sentiment)
        
        Args:
        - text: nội dung review
        - toxic_scores: từ unitary/toxic-bert
        - phobert_result: từ PhoBERT sentiment (optional)
        
        Returns:
        {
            "text": str,
            "status": "APPROVED" | "BLOCKED" | "ADMIN_REVIEW" | "SOFT_FLAG",
            "reason": str,
            "layers": [L1_result, L2_result, L3_result, L4_result?],
            "final_decision": {
                "use_for_stats": bool,
                "display_on_ui": bool,
                "sentiment": str?,
                "admin_action": str?
            }
        }
        """
        
        layers_result = []
        
        # ===== LAYER 1: TOXIC FILTER =====
        l1_result = ToxicFilter.process(text, toxic_scores)
        layers_result.append(l1_result)
        
        if l1_result["status"] == "BLOCK":
            return {
                "text": text,
                "status": "BLOCKED",
                "reason": l1_result["reason"],
                "layers": layers_result,
                "final_decision": {
                    "use_for_stats": False,
                    "display_on_ui": False,
                    "admin_action": "review_and_approve",
                    "queue_reason": "L1_SEVERE_TOXIC"
                }
            }
        
        if l1_result["status"] == "SOFT_FLAG":
            # Tiếp tục kiểm tra nhưng sẽ qua admin duyệt
            pass
        
        # ===== LAYER 2: PRODUCT REVIEW CLASSIFIER =====
        l2_result = ProductReviewClassifier.process(text)
        layers_result.append(l2_result)
        
        if l2_result["status"] == "REJECT":
            return {
                "text": text,
                "status": "ADMIN_REVIEW",
                "reason": l2_result["reason"],
                "layers": layers_result,
                "final_decision": {
                    "use_for_stats": False,
                    "display_on_ui": False,
                    "admin_action": "verify_category",
                    "queue_reason": f"L2_{l2_result['category']}"
                }
            }
        
        # ===== LAYER 3: META-REVIEW FILTER =====
        l3_result = MetaReviewFilter.process(text)
        layers_result.append(l3_result)
        
        if l3_result["status"] == "REJECT":
            return {
                "text": text,
                "status": "ADMIN_REVIEW",
                "reason": l3_result["reason"],
                "layers": layers_result,
                "final_decision": {
                    "use_for_stats": False,
                    "display_on_ui": True,  # Vẫn hiển thị nhưng không tính stats
                    "admin_action": "verify_meta_review",
                    "queue_reason": "L3_META_REVIEW"
                }
            }
        
        # ===== LAYER 4: SENTIMENT (PhoBERT) =====
        sentiment_result = None
        if phobert_result:
            sentiment_result = SentimentAnalyzer.process(text, phobert_result)
            layers_result.append(sentiment_result)
        
        # ===== FINAL DECISION =====
        if l1_result["status"] == "SOFT_FLAG":
            # Toxic soft flag → admin duyệt nhưng có sentiment
            # Determine queue reason from L1 result
            queue_reason = "L1_SOFT_FLAG_TOXIC"
            if "insult" in l1_result.get("reason", ""):
                queue_reason = "L1_INSULT_DETECTED"
            elif "lăng mạ" in l1_result.get("reason", ""):
                queue_reason = "L1_INSULT_DETECTED"
            
            return {
                "text": text,
                "status": "SOFT_FLAG",
                "reason": "Phát hiện nội dung độc hại nhưng có thể là feedback xây dựng",
                "layers": layers_result,
                "final_decision": {
                    "use_for_stats": False,
                    "display_on_ui": False,  # Ẩn cho đến khi admin duyệt
                    "sentiment": sentiment_result.get("sentiment") if sentiment_result else None,
                    "admin_action": "approve_or_reject",
                    "queue_reason": queue_reason,
                    "sentiment_info": sentiment_result
                }
            }
        
        # Check: L1 PASS but sentiment is NEGATIVE → still needs review
        if sentiment_result and sentiment_result.get("sentiment") == "NEG":
            # Negative sentiment with some toxic component → soft flag
            insult_score = toxic_scores.get("insult", 0)
            if insult_score > 0.01 or "insult" in l1_result.get("toxic_categories", []):
                return {
                    "text": text,
                    "status": "SOFT_FLAG",
                    "reason": "Negative sentiment + mild insult → cần duyệt",
                    "layers": layers_result,
                    "final_decision": {
                        "use_for_stats": False,
                        "display_on_ui": False,
                        "sentiment": sentiment_result.get("sentiment"),
                        "admin_action": "approve_or_reject",
                        "queue_reason": "L4_NEGATIVE_WITH_INSULT",
                        "sentiment_info": sentiment_result
                    }
                }
        
        # All pass → sử dụng được
        return {
            "text": text,
            "status": "APPROVED",
            "reason": "Qua tất cả lớp xử lý",
            "layers": layers_result,
            "final_decision": {
                "use_for_stats": True,
                "display_on_ui": True,
                "sentiment": sentiment_result.get("sentiment") if sentiment_result else None,
                "sentiment_info": sentiment_result,
                "admin_action": None
            }
        }


# ===== EXPORT =====
if __name__ == "__main__":
    # Test
    test_text = "Độ ngu, bán hàng như các vây cùng mở shop"
    test_toxic_scores = {
        "toxic": 0.45,
        "severe_toxic": 0.1,
        "obscene": 0.2,
        "threat": 0.05,
        "insult": 0.65,
        "identity_hate": 0.05
    }
    
    result = ReviewPipeline.process(test_text, test_toxic_scores)
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))
