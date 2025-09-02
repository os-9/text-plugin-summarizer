from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from fastapi import HTTPException

app = FastAPI(title="News Summarizer")

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

    summary = summarizer(article.text, max_length=130, min_length=30, do_sample=False)
    return {"summary": summary[0]['summary_text']}