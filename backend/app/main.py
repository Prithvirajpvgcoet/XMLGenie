from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.retrieve import router as retrieve_router
from app.api.chat import router as chat_router
from app.api.compare import router as compare_router
from app.api.documents import router as documents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(retrieve_router)
app.include_router(chat_router)
app.include_router(compare_router)
app.include_router(documents_router)



@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "status": "running"}