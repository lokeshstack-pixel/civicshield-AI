from fastapi import FastAPI

app = FastAPI(
    title="CIVICSHIELD API",
    description="AI-powered Civic Incident Intelligence Platform",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "project": "CIVICSHIELD",
        "status": "running",
        "message": "Civic Incident Intelligence API is working"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }