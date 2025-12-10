# main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    pipeline as hf_pipeline,
)
import torch
from typing import Dict, List, Tuple
import logging
import re

from review_pipeline import ReviewPipeline 

# ======================== LOGGING ========================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ======================== FASTAPI APP ========================

app = FastAPI(
    title="Review Moderation API",
    description="4-layer review pipeline: Toxic-BERT + ProductReview + MetaReview + PhoBERT",
    version="1.0.0",
)

# ======================== TOXIC-BERT MODEL ========================

TOXIC_MODEL_PATH = "./toxic_bert_model"  # Local folder (git-lfs)
TOXIC_MODEL_HUB_ID = "unitary/toxic-bert"  # Fallback: Hugging Face Hub


def load_toxic_model() -> Tuple[AutoTokenizer, AutoModelForSequenceClassification, str]:
    """
    Try local weights first (may be Git LFS pointers); fall back to Hugging Face Hub.
    Returns tokenizer, model, and the source string that was used.
    """
    for source in (TOXIC_MODEL_PATH, TOXIC_MODEL_HUB_ID):
        try:
            logger.info(f"Loading toxic model from: {source}")
            tokenizer = AutoTokenizer.from_pretrained(source)
            model = AutoModelForSequenceClassification.from_pretrained(source)
            logger.info(f"✅ Toxic model loaded successfully from {source}")
            return tokenizer, model, source
        except Exception as e:
            logger.warning(
                f"⚠️  Failed to load toxic model from {source}: {e}. "
                "If you expected local weights, ensure Git LFS files are pulled."
            )

    raise RuntimeError(
        "Unable to load toxic model from local folder or Hugging Face Hub."
    )


toxic_tokenizer, toxic_model, TOXIC_MODEL_SOURCE = load_toxic_model()


# Device
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
toxic_model.to(DEVICE)
toxic_model.eval()

logger.info(f"✅ Toxic model on device: {DEVICE}")
if torch.cuda.is_available():
    logger.info(f"   GPU: {torch.cuda.get_device_name(0)}")

# Toxic labels (theo config của unitary/toxic-bert)
TOXIC_LABELS = [
    "toxic",           # 0
    "severe_toxic",    # 1
    "obscene",         # 2
    "threat",          # 3
    "insult",          # 4
    "identity_hate",   # 5
]

TOXIC_LABELS_VI = {
    "toxic": "Bình luận độc hại",
    "severe_toxic": "Độc hại nghiêm trọng",
    "obscene": "Không phù hợp/tục tĩu",
    "threat": "Đe dọa",
    "insult": "Nhục mạ",
    "identity_hate": "Kỳ thị danh tính",
}

TOXIC_THRESHOLD = 0.5
HIGH_PRIORITY_CATEGORIES = {"severe_toxic", "threat"}

# ======================== PHOBERT SENTIMENT MODEL ========================

SENTIMENT_MODEL_PATH = "./phobert-base-vi-sentiment-analysis"
SENTIMENT_MODEL_HUB_ID = "mr4/phobert-base-vi-sentiment-analysis"


def load_sentiment_model():
    """
    Try local PhoBERT weights; fall back to Hugging Face Hub if local files are only LFS pointers.
    Returns (pipeline, source_used | None).
    """
    for source in (SENTIMENT_MODEL_PATH, SENTIMENT_MODEL_HUB_ID):
        try:
            logger.info(f"Loading sentiment model (PhoBERT) from: {source}")
            classifier = hf_pipeline("sentiment-analysis", model=source)
            logger.info(f"✅ Sentiment model loaded successfully from {source}")
            return classifier, source
        except Exception as e:
            logger.warning(
                f"⚠️  Failed to load sentiment model from {source}: {e}. "
                "If you expected local weights, ensure Git LFS files are pulled."
            )

    logger.error("❌ Unable to load sentiment model from local folder or Hugging Face Hub.")
    return None, None


sentiment_classifier, SENTIMENT_MODEL_SOURCE = load_sentiment_model()

# ======================== BUSINESS RULES ========================


class BusinessRuleFlags:
    """Business logic flags để điều chỉnh hành vi auto-blocking"""

    FEEDBACK_KEYWORDS = [
        r"(?:nên|cần|phải|có\s*thể)\s+(?:cải\s*thiện|thay\s*đổi|sửa\s*chữa|cải\s*thiện)",
        r"nên\s+cải\s*thiện",
        r"(?:góp\s*ý|mong|hy\s*vọng|đề\s*nghị|yêu\s*cầu|nhận\s*xét)",
        r"(?:lần\s*(?:sau|tới)|tới\s*lần\s*sau).*(?:cải\s*thiện|sửa|thay\s*đổi)",
        r"(?:tệ|xấu|không\s+tốt|kém).*(?:nên|cần|phải).*(?:cải\s*thiện|sửa|thay)",
        r"nếu\s+(?:cải\s*thiện|thay\s*đổi|sửa)",
        r"cơ\s*hội.*(?:cải\s*thiện|thay\s*đổi|sửa)",
        r"(?:bán\s*hàng|dịch\s*vụ|sản\s*phẩm|chất\s*lượng).*(?:tệ|xấu|không|kém)",
    ]

    SPAM_KEYWORDS = [
        r"(?:liên\s*hệ|zalo|facebook|whatsapp|gmail|email)[\s:=]*[\w\d\-\._@]+",
        r"(?:mua\s*ở|mua\s*tại|shop\s*khác|cửa\s*hàng\s*khác)[\s:=]*[\w\d\-\._/]+",
        r"(?:fake|giả|hàng\s*fake|hàng\s*giả|nhái)",
        r"(?:tuyển\s*dụng|công\s*việc|thu\s*nhập)[\s:=]*[\w\d\-\._]+",
    ]

    THREAT_KEYWORDS = [
        r"(?:đe\s*dọa|sẽ\s*kiện|sẽ\s*tố\s*cáo)",
        r"(?:địa\s*chỉ|nhà\s*bạn|gia\s*đình|con\s*em|vợ\s*con).*(?:đến|ghé)",
    ]

    NEGATIVE_WORDS = [
        r"tệ",
        r"xấu",
        r"kém",
        r"tồi",
        r"không\s+tốt",
        r"thất\s+vọng",
        r"khủng\s+khiếp",
        r"cực\s+tệ",
        r"tệ\s+vãi",
    ]

    OBSCENE_WORDS = [
        r"cặc",
        r"dmm",
        r"cmm",
        r"mẹ\s*kiếp",
        r"đụ",
        r"l*n",
        r"fuck|shit|damn|ass\b",
    ]

    INSULT_WORDS = [
        r"\bngu\b",
        r"\bngốc\b",
        r"\bđần\b",
        r"\bóc\b",
        r"\bvô\s*duyên\b",
        r"\bkém\s*dạy\b",
        r"\bthô\s*lỗ\b",
        r"\bcứt\b",
        r"\blừa\s*đảo\b",
        r"\bchơi\s*xấu\b",
]

    DISCRIMINATION_PATTERNS = [
        r"(?:tất\s*cả|mọi).*(?:dân|người)\s+[^\s]+\s*(?:đều|là)\s*(?:xấu|tồi|ngu)",
    ]

    @staticmethod
    def check_feedback_pattern(text: str) -> Tuple[bool, str]:
        for pattern in BusinessRuleFlags.FEEDBACK_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "feedback_gopy"
        return False, ""

    @staticmethod
    def check_spam_pattern(text: str) -> Tuple[bool, str]:
        for pattern in BusinessRuleFlags.SPAM_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "spam"
        return False, ""

    @staticmethod
    def check_threat_pattern(text: str) -> Tuple[bool, str]:
        for pattern in BusinessRuleFlags.THREAT_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True, "threat_danger"
        return False, ""

    @staticmethod
    def check_negative_words(text: str) -> bool:
        for pattern in BusinessRuleFlags.NEGATIVE_WORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True
        return False

    @staticmethod
    def check_obscene_words(text: str) -> bool:
        for pattern in BusinessRuleFlags.OBSCENE_WORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True
        return False

    @staticmethod
    def check_insult_words(text: str) -> bool:
        for pattern in BusinessRuleFlags.INSULT_WORDS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True
        return False

    @staticmethod
    def check_discrimination(text: str) -> bool:
        for pattern in BusinessRuleFlags.DISCRIMINATION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
                return True
        return False

    @staticmethod
    def apply_business_rules(text: str, ai_is_toxic: bool, ai_toxic_types: List[str]) -> Dict:
        applied_rules: List[str] = []
        auto_block = False
        soft_flag = False
        reason = ""

        # 1. Threat / danger → auto block
        has_threat, threat_reason = BusinessRuleFlags.check_threat_pattern(text)
        if has_threat:
            applied_rules.append(f"HARD_BLOCK: {threat_reason}")
            return {
                "auto_block": True,
                "soft_flag": False,
                "reason": "Phát hiện nội dung đe dọa/nguy hiểm",
                "applied_rules": applied_rules,
            }

        # 1.5. Discrimination → auto block
        if BusinessRuleFlags.check_discrimination(text):
            applied_rules.append("HARD_BLOCK: Discrimination/hate speech")
            return {
                "auto_block": True,
                "soft_flag": False,
                "reason": "Phát hiện nội dung kỳ thị/phân biệt",
                "applied_rules": applied_rules,
            }

        # 2. Spam → auto block
        has_spam, spam_reason = BusinessRuleFlags.check_spam_pattern(text)
        if has_spam:
            applied_rules.append(f"HARD_BLOCK: {spam_reason}")
            return {
                "auto_block": True,
                "soft_flag": False,
                "reason": "Phát hiện spam/quảng cáo",
                "applied_rules": applied_rules,
            }

        # 2.3. Obscene words, không phải feedback → auto block
                # 2.3. Obscene words, không phải feedback → SOFT FLAG (không auto block)
        has_obscene = BusinessRuleFlags.check_obscene_words(text)
        is_feedback = BusinessRuleFlags.check_feedback_pattern(text)[0]
        if has_obscene and not is_feedback:
            applied_rules.append("SOFT_FLAG: Obscene words (no feedback)")
            return {
                "auto_block": False,
                "soft_flag": True,
                "reason": "Từ ngữ tục tĩu, không phù hợp → chuyển admin duyệt",
                "applied_rules": applied_rules,
            }


        # 2.4. Insult words, không phải feedback → soft flag
        has_insult = BusinessRuleFlags.check_insult_words(text)
        is_feedback = BusinessRuleFlags.check_feedback_pattern(text)[0]
        if has_insult and not is_feedback:
            applied_rules.append("SOFT_FLAG: Insult words (no feedback)")
            return {
                "auto_block": False,
                "soft_flag": True,
                "reason": "Nhục mạ cá nhân → chuyển admin duyệt",
                "applied_rules": applied_rules,
            }

        # 2.5. Feedback + negative / obscene / insult → soft flag
        is_feedback = BusinessRuleFlags.check_feedback_pattern(text)[0]
        has_negative = BusinessRuleFlags.check_negative_words(text)
        has_obscene = BusinessRuleFlags.check_obscene_words(text)
        has_insult = BusinessRuleFlags.check_insult_words(text)

        if is_feedback and (has_negative or has_obscene or has_insult):
            applied_rules.append(
                "SOFT_FLAG: Feedback + negative/obscene/insult words"
            )
            return {
                "auto_block": False,
                "soft_flag": True,
                "reason": "Góp ý nhưng dùng từ tiêu cực/tục → admin duyệt",
                "applied_rules": applied_rules,
            }

        # 3. AI báo toxic
        if ai_is_toxic and ("insult" in ai_toxic_types or "toxic" in ai_toxic_types):
            is_feedback, feedback_reason = BusinessRuleFlags.check_feedback_pattern(
                text
            )
            if is_feedback:
                applied_rules.append(f"SOFT_FLAG: Toxic nhưng là {feedback_reason}")
                soft_flag = True
                reason = "Nội dung toxic nhưng là góp ý → admin duyệt"
            else:
                applied_rules.append("HARD_BLOCK: Toxic + insult/obscene")
                auto_block = True
                reason = "Nội dung độc hại, không phải góp ý → auto chặn"

        # 5. Severe toxic / threat từ AI → auto block
        if "severe_toxic" in ai_toxic_types or "threat" in ai_toxic_types:
            applied_rules.append("HARD_BLOCK: Severe/threat from AI")
            auto_block = True
            reason = "Độc hại mức cao → auto chặn"

        if not reason:
            reason = "Passed all business rules"

        return {
            "auto_block": auto_block,
            "soft_flag": soft_flag,
            "reason": reason,
            "applied_rules": applied_rules,
        }


# ======================== MODELS ========================


class ToxicRequest(BaseModel):
    text: str


class ToxicResponse(BaseModel):
    is_toxic: bool
    toxic_score: float
    toxic_threshold: float
    toxic_categories: Dict[str, float]
    toxic_types: List[str]
    toxic_reason: str
    confidence: float

    auto_block: bool
    soft_flag: bool
    business_rule_reason: str
    applied_rules: List[str]


class SentimentRequest(BaseModel):
    text: str


class SentimentSimpleResponse(BaseModel):
    label: str
    score: float


# ======================== CORE FUNCTIONS ========================


def detect_toxic_content(text: str) -> ToxicResponse:
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(text) > 5000:
        logger.warning(f"Text too long ({len(text)} chars), truncating to 5000")
        text = text[:5000]

    try:
        inputs = toxic_tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
            return_attention_mask=True,
        )

        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = toxic_model(**inputs)
            logits = outputs.logits  # (1, 6)

        probabilities = torch.sigmoid(logits).cpu().numpy()[0]
    except Exception as e:
        logger.error(f"Error during toxic inference: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")

    toxic_scores = {
        label: round(float(probabilities[idx]), 4)
        for idx, label in enumerate(TOXIC_LABELS)
    }

    toxic_types = [
        label
        for idx, label in enumerate(TOXIC_LABELS)
        if probabilities[idx] > TOXIC_THRESHOLD
    ]

    toxic_score = round(float(max(probabilities)), 4)
    is_toxic = toxic_score > TOXIC_THRESHOLD

    if toxic_types:
        toxic_reasons_vi = [TOXIC_LABELS_VI.get(t, t) for t in toxic_types]
        toxic_reason = "Phát hiện: " + ", ".join(toxic_reasons_vi)
        if any(t in HIGH_PRIORITY_CATEGORIES for t in toxic_types):
            toxic_reason += " ⚠️"
    else:
        toxic_reason = "Không phát hiện nội dung độc hại"

    confidence = toxic_score

    business_rules = BusinessRuleFlags.apply_business_rules(
        text, is_toxic, toxic_types
    )

    return ToxicResponse(
        is_toxic=is_toxic,
        toxic_score=toxic_score,
        toxic_threshold=TOXIC_THRESHOLD,
        toxic_categories=toxic_scores,
        toxic_types=toxic_types,
        toxic_reason=toxic_reason,
        confidence=confidence,
        auto_block=business_rules["auto_block"],
        soft_flag=business_rules["soft_flag"],
        business_rule_reason=business_rules["reason"],
        applied_rules=business_rules["applied_rules"],
    )


# ======================== ENDPOINTS ========================


@app.post("/toxic", response_model=ToxicResponse)
async def analyze_toxic(req: ToxicRequest):
    """
    Layer 1 – Toxic Filter: chỉ chạy Unitary Toxic-BERT + Business Rules.
    """
    result = detect_toxic_content(req.text)
    return result


@app.post("/sentiment", response_model=SentimentSimpleResponse)
async def analyze_sentiment(req: SentimentRequest):
    """
    Endpoint test nhanh PhoBERT (Layer 4 standalone).
    """
    if sentiment_classifier is None:
        raise HTTPException(
            status_code=500, detail="Sentiment model is not loaded on server"
        )
    try:
        out = sentiment_classifier(req.text)[0]
        return SentimentSimpleResponse(label=out["label"], score=float(out["score"]))
    except Exception as e:
        logger.error(f"Error in sentiment endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze_full_pipeline(req: ToxicRequest):
    """
    Chạy ĐẦY ĐỦ 4 LAYERS thông qua ReviewPipeline:

    L1: Toxic Filter (unitary/toxic-bert + business rules)
    L2: Product-review classifier (trong ReviewPipeline)
    L3: Meta-review filter + admin queue (trong ReviewPipeline)
    L4: Sentiment PhoBERT (trong ReviewPipeline, dùng phobert_result)
    """
    # L1 – Toxic
    toxic_result = detect_toxic_content(req.text)

    toxic_categories = toxic_result.toxic_categories or {}

    toxic_scores = {
        "toxic": toxic_result.toxic_score,
        "severe_toxic": toxic_categories.get("severe_toxic", 0.0),
        "obscene": toxic_categories.get("obscene", 0.0),
        "threat": toxic_categories.get("threat", 0.0),
        "insult": toxic_categories.get("insult", 0.0),
        "identity_hate": toxic_categories.get("identity_hate", 0.0),
    }

    # L4 – PhoBERT raw output (đưa vào pipeline xử lý)
    phobert_result = None
    if sentiment_classifier:
        try:
            phobert_result = sentiment_classifier(req.text)
        except Exception as e:
            logger.error(f"Error in PhoBERT sentiment classification: {e}", exc_info=True)

    # Full pipeline
    pipeline_result = ReviewPipeline.process(
        text=req.text,
        toxic_scores=toxic_scores,
        phobert_result=phobert_result
    )


    return pipeline_result


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "toxic_model": TOXIC_MODEL_SOURCE,
        "sentiment_model": SENTIMENT_MODEL_SOURCE or SENTIMENT_MODEL_PATH,
        "device": str(DEVICE),
    }


@app.get("/info")
async def model_info():
    return {
        "toxic_model_name": TOXIC_MODEL_SOURCE,
        "labels": TOXIC_LABELS,
        "labels_vi": TOXIC_LABELS_VI,
        "threshold": TOXIC_THRESHOLD,
        "high_priority": list(HIGH_PRIORITY_CATEGORIES),
        "device": str(DEVICE),
        "description": "Toxic-BERT trained on Jigsaw Toxic Comment dataset",
        "reference": "https://huggingface.co/unitary/toxic-bert",
    }


@app.on_event("startup")
async def startup_event():
    logger.info("Review Moderation API started")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Review Moderation API shutting down")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5002, log_level="info")
