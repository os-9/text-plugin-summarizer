from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from fastapi import HTTPException

app = FastAPI(title="News Summarizer")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension's origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

class Article(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "News Summarizer API is Running"}

@app.post("/summarize")
async def summarize_article(article: Article):
    if not article.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Add error handling for the summarizer
    try:
        summary = summarizer(article.text, max_length=130, min_length=30, do_sample=False)
        return {"summary": summary[0]['summary_text']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")