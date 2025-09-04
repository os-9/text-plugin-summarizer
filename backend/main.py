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
    
    print(f"Received text length: {len(article.text)} characters")
    print(f"First 200 characters: {article.text[:200]}")
    
    # Truncate text if it's too long (models typically handle ~1024 tokens = ~4000 characters)
    max_chars = 4000
    text_to_summarize = article.text[:max_chars] if len(article.text) > max_chars else article.text
    
    if len(article.text) > max_chars:
        print(f"Text truncated from {len(article.text)} to {len(text_to_summarize)} characters")
    
    try:
        print("Starting summarization...")
        summary = summarizer(
            text_to_summarize, 
            max_length=400, 
            min_length=150, 
            do_sample=False,
            truncation=True  # Ensure model truncates if needed
        )
        print("Summarization completed successfully")
        return {"summary": summary[0]['summary_text']}
    except Exception as e:
        print(f"Summarization error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")