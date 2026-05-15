from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.dependencies import get_current_user
from app.models.user import User
from app.models.article import Article
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest
from app.services.ai_service import chat_stream
import uuid

router = APIRouter()


# POST /api/chat — AI 챗봇 메시지 전송 (SSE 스트리밍)
@router.post("")
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 기사 조회
    article = db.query(Article).filter(Article.id == body.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="기사를 찾을 수 없습니다")

    # 세션 조회 또는 생성
    session = None
    if body.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == body.session_id,
            ChatSession.user_id == current_user.id
        ).first()

    if not session:
        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            article_id=body.article_id,
            title=article.title[:50]
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # 유저 메시지 저장
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session.id,
        role="user",
        content=body.message
    )
    db.add(user_msg)
    db.commit()

    # 이전 대화 기록 조회
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).all()

    messages = [{"role": m.role, "content": m.content} for m in history]

    article_title = article.title
    article_content = article.content or ""
    session_id = session.id
    ai_response_buffer = []

    async def generate():
        try:
            async for chunk in chat_stream(
                article_title=article_title,
                article_content=article_content,
                messages=messages
            ):
                if chunk != "data: [DONE]\n\n":
                    text = chunk.replace("data: ", "").strip()
                    if text:
                        ai_response_buffer.append(text)
                yield chunk
        finally:
            # 요청 스코프 DB 세션이 닫힌 후에도 안전하게 저장하기 위해 독립 세션 사용
            full_response = "".join(ai_response_buffer)
            if full_response:
                save_db = SessionLocal()
                try:
                    ai_msg = ChatMessage(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        role="assistant",
                        content=full_response
                    )
                    save_db.add(ai_msg)
                    save_db.commit()
                except Exception as e:
                    print(f"[chat] AI 응답 저장 실패: {e}")
                    save_db.rollback()
                finally:
                    save_db.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "X-Session-Id": session.id,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# GET /api/chat/sessions — 챗봇 세션 목록 조회
@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).all()

    return {
        "success": True,
        "data": [
            {
                "id": s.id,
                "article_id": s.article_id,
                "title": s.title,
                "created_at": s.created_at.isoformat(),
            }
            for s in sessions
        ]
    }


# GET /api/chat/sessions/{session_id}/messages — 세션 메시지 조회
@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()

    return {
        "success": True,
        "data": {
            "session_id": session_id,
            "article_id": session.article_id,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat(),
                }
                for m in messages
            ]
        }
    }