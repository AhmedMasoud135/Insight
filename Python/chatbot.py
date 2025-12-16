import io
import os
import faiss
import PyPDF2
import requests
import numpy as np
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, UploadFile, File, HTTPException

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

app = FastAPI(title="RAG PDF System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embedder = SentenceTransformer('all-MiniLM-L6-v2')

pdf_store = {
    "chunks": [],
    "embeddings": None,
    "index": None
}

class Question(BaseModel):
    question: str

def extract_text_from_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def split_text(text, chunk_size=500):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def create_embeddings(chunks):
    embeddings = embedder.encode(chunks)
    return np.array(embeddings).astype('float32')

def create_faiss_index(embeddings):
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index

def search_similar(query, top_k=3):
    if pdf_store["index"] is None:
        return []
    
    query_embedding = np.array(embedder.encode([query])).astype('float32')
    _, indices = pdf_store["index"].search(query_embedding, top_k)
    
    results = []
    for idx in indices[0]:
        if idx < len(pdf_store["chunks"]):
            results.append(pdf_store["chunks"][idx])
    
    return results

def ask_llm(question, context):
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    if context:
        prompt = f"""Based on the following information, answer the question in detail:

Information:
{context}

Question: {question}

Answer:"""
    else:
        prompt = question
    
    data = {
        "model": "openai/gpt-3.5-turbo", 
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        return f"Error connecting to model: {str(e)}"
    except KeyError as e:
        return f"Error parsing response: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be PDF")
    
    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        text = extract_text_from_pdf(pdf_file)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")
        
        chunks = split_text(text)
        embeddings = create_embeddings(chunks)
        index = create_faiss_index(embeddings)
        
        pdf_store["chunks"] = chunks
        pdf_store["embeddings"] = embeddings
        pdf_store["index"] = index
        
        return JSONResponse({
            "message": "File uploaded and processed successfully",
            "num_chunks": len(chunks),
            "total_characters": len(text)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/ask/")
async def ask_question(question: Question):
    try:
        if pdf_store["index"] is not None:
            relevant_chunks = search_similar(question.question, top_k=3)
            
            if relevant_chunks:
                context = "\n\n".join(relevant_chunks)
                answer = ask_llm(question.question, context)
                
                return JSONResponse({
                    "question": question.question,
                    "answer": answer,
                    "sources_used": len(relevant_chunks)
                })
        
        answer = ask_llm(question.question, "")
        
        return JSONResponse({
            "question": question.question,
            "answer": answer,
            "sources_used": 0
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "RAG System for PDF Processing",
        "pdf_loaded": pdf_store["index"] is not None,
        "endpoints": {
            "/upload-pdf/": "POST - Upload PDF file",
            "/ask/": "POST - Ask a question (works with or without PDF)",
            "/docs": "Swagger UI for testing"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)