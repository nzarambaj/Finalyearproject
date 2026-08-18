import glob
import os
import shutil
import subprocess
import tempfile
import zipfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

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
        file.file,
        file.filename or ""
    )

    return metadata


@app.post("/convert")
def convert_to_nifti(file: UploadFile = File(...)):
    """
    Convert an uploaded DICOM to NIfTI with dcm2niix.

    Accepts either a .zip of a DICOM series (preferred,
    since a proper 3D volume needs the whole series) or a
    single .dcm file. Returns the resulting .nii.gz.
    """

    workdir = tempfile.mkdtemp(prefix="dcm2niix_")
    indir = os.path.join(workdir, "in")
    outdir = os.path.join(workdir, "out")
    os.makedirs(indir, exist_ok=True)
    os.makedirs(outdir, exist_ok=True)

    try:
        name = (file.filename or "upload").lower()
        raw = file.file.read()

        if name.endswith(".zip"):
            zip_path = os.path.join(workdir, "series.zip")
            with open(zip_path, "wb") as f:
                f.write(raw)
            with zipfile.ZipFile(zip_path) as z:
                z.extractall(indir)
        else:
            fname = os.path.basename(file.filename or "image.dcm")
            with open(os.path.join(indir, fname), "wb") as f:
                f.write(raw)

        binary = _dcm2niix_binary()
        if not binary:
            raise HTTPException(
                status_code=500,
                detail="dcm2niix binary not available"
            )

        # -z y: gzip output, -f: fixed output name,
        # -o: output dir, last arg: input dir (recursive).
        result = subprocess.run(
            [binary, "-z", "y", "-f", "converted",
             "-o", outdir, indir],
            capture_output=True,
            text=True,
            timeout=300
        )

        produced = glob.glob(os.path.join(outdir, "*.nii.gz"))

        if not produced:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Conversion produced no NIfTI. dcm2niix "
                    "needs a valid DICOM series. "
                    + (result.stderr or result.stdout or "")[:300]
                )
            )

        # Return the first (or largest) produced volume.
        produced.sort(key=os.path.getsize, reverse=True)
        out_path = produced[0]

        # FileResponse streams then we clean up the temp
        # dir via a background task.
        from starlette.background import BackgroundTask

        return FileResponse(
            out_path,
            media_type="application/gzip",
            filename="converted.nii.gz",
            background=BackgroundTask(
                shutil.rmtree, workdir, True
            )
        )

    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed: {exc}"
        )


def _dcm2niix_binary():
    """Locate the dcm2niix executable (PATH or the pip
    package's bundled binary)."""

    found = shutil.which("dcm2niix")
    if found:
        return found

    try:
        import dcm2niix
        candidate = os.path.join(
            os.path.dirname(dcm2niix.__file__),
            "dcm2niix"
        )
        if os.path.exists(candidate):
            return candidate
        if os.path.exists(candidate + ".exe"):
            return candidate + ".exe"
    except Exception:
        pass

    return None
