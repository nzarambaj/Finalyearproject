from fastapi import FastAPI, File, UploadFile

from dicomreader import extract_metadata

app = FastAPI()


@app.get("/")
def root():
    return {
        "message": "DICOM Service Running"
    }


@app.post("/extract")
def extract_dicom(file: UploadFile = File(...)):

    metadata = extract_metadata(
        file.file
    )

    return metadata
