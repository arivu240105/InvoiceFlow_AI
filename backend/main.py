import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.api.endpoints import router as api_router, UPLOAD_DIR

app = FastAPI(
    title="InvoiceFlow AI API",
    description="Backend API for Intelligent Invoice Processing & Finance Automation Assistant",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo / local sandbox simplicity. Can be restricted to Vite ports.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the temporary upload directory for static previews
app.mount("/previews", StaticFiles(directory=UPLOAD_DIR), name="previews")

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to InvoiceFlow AI API. Service is online."}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
