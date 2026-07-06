from fastapi import FastAPI
from pydantic import BaseModel

from dicomreader import extract_metadata

app = FastAPI()


class DicomRequest(BaseModel):
    file_path: str


@app.get("/")
def root():
    return {
        "message": "DICOM Service Running"
    }


@app.post("/extract")
def extract_dicom(request: DicomRequest):

    metadata = extract_metadata(
        request.file_path
    )

    return metadata