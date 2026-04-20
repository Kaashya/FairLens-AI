from fastapi import FastAPI

app = FastAPI(title="FairLens API")

@app.get("/")
def root():
    return {"message": "FairLens API running"}