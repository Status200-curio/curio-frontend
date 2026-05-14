"""
백그라운드 AI 요약 생성 스크립트
사용법: python scripts/generate_summaries.py
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.article import Article
from app.services.ai_service import generate_summary, translate_title

def run():
    db = SessionLocal()
    try:
        unsummarized = db.query(Article).filter(
            Article.ai_summary == None
        ).order_by(Article.published_at.desc()).all()

        total = len(unsummarized)
        print(f"요약 생성 대상: {total}개")

        for i, article in enumerate(unsummarized, 1):
            print(f"[{i}/{total}] {article.title[:40]}")

            # 영어 제목이면 번역
            translated = translate_title(article.title)
            if translated != article.title:
                article.title = translated
                print(f"  → 번역: {translated[:40]}")
            time.sleep(2)

            # AI 요약 생성
            summary = generate_summary(article.title, article.content or "")
            if summary:
                article.ai_summary = summary
                db.commit()
                print(f"  → 요약 완료")
            else:
                print(f"  → 요약 실패 (스킵)")

            time.sleep(3)

    except KeyboardInterrupt:
        print("\n중단됨. 지금까지 생성된 요약은 저장됨.")
    finally:
        db.close()

if __name__ == "__main__":
    run()
