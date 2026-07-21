import os
import tempfile

import nibabel as nib
import pydicom


def safe_get(ds, tag, default=""):
    value = ds.get(tag, default)

    if value is None:
        return default

    return str(value)


def is_nifti(source, filename=""):
    """
    Detect NIfTI by filename, then by magic bytes:
    gzip (0x1f 0x8b) for .nii.gz, or the NIfTI-1
    magic string ("n+1"/"ni1") at offset 344.
    """
    name = (filename or "").lower()

    if name.endswith(".nii") or name.endswith(".nii.gz"):
        return True

    if name.endswith(".dcm"):
        return False

    head = source.read(348)
    source.seek(0)

    if head[:2] == b"\x1f\x8b":
        return True

    if len(head) >= 348 and head[344:347] in (b"n+1", b"ni1"):
        return True

    return False


def extract_metadata(source, filename=""):

    # source may be a path or a binary file-like
    # object (e.g. an uploaded file's stream)
    if hasattr(source, "read") and is_nifti(source, filename):
        return extract_nifti_metadata(source, filename)

    return extract_dicom_metadata(source)


def extract_dicom_metadata(source):

    ds = pydicom.dcmread(source)

    return {

        "format": "DICOM",

        # Patient
        "patient_id": safe_get(ds, "PatientID"),
        "patient_name": safe_get(ds, "PatientName"),
        "patient_sex": safe_get(ds, "PatientSex"),
        "patient_birth_date": safe_get(ds, "PatientBirthDate"),

        # Study
        "study_instance_uid": safe_get(ds, "StudyInstanceUID"),
        "study_date": safe_get(ds, "StudyDate"),
        "study_time": safe_get(ds, "StudyTime"),
        "study_description": safe_get(ds, "StudyDescription"),
        "accession_number": safe_get(ds, "AccessionNumber"),

        # Series
        "series_instance_uid": safe_get(ds, "SeriesInstanceUID"),
        "series_description": safe_get(ds, "SeriesDescription"),
        "series_number": safe_get(ds, "SeriesNumber"),

        # Image
        "modality": safe_get(ds, "Modality"),
        "rows": ds.get("Rows", 0),
        "columns": ds.get("Columns", 0),
        "bits_allocated": ds.get("BitsAllocated", 0),
        "bits_stored": ds.get("BitsStored", 0),
        "samples_per_pixel": ds.get("SamplesPerPixel", 0),
        "photometric_interpretation":
            safe_get(ds, "PhotometricInterpretation"),

        # Scanner
        "manufacturer": safe_get(ds, "Manufacturer"),
        "manufacturer_model":
            safe_get(ds, "ManufacturerModelName"),
        "station_name": safe_get(ds, "StationName"),

        # Acquisition
        "slice_thickness":
            safe_get(ds, "SliceThickness"),

        "pixel_spacing":
            str(ds.get("PixelSpacing", "")),

        "image_position_patient":
            str(ds.get("ImagePositionPatient", "")),

        "image_orientation_patient":
            str(ds.get("ImageOrientationPatient", ""))
    }


def extract_nifti_metadata(source, filename=""):
    """
    NIfTI stores volume geometry but no patient or
    study information, so those fields stay empty and
    the platform falls back to the form values.
    """

    suffix = (
        ".nii.gz"
        if (filename or "").lower().endswith(".nii.gz")
        or _peek(source, 2) == b"\x1f\x8b"
        else ".nii"
    )

    # nibabel loads from a path, so persist the
    # stream to a temporary file first.
    tmp = tempfile.NamedTemporaryFile(
        suffix=suffix,
        delete=False
    )

    try:
        tmp.write(source.read())
        tmp.close()

        img = nib.load(tmp.name)
        header = img.header

        shape = img.shape
        zooms = header.get_zooms()

        return {

            "format": "NIFTI",

            # Patient (not stored in NIfTI)
            "patient_id": "",
            "patient_name": "",
            "patient_sex": "",
            "patient_birth_date": "",

            # Study (not stored in NIfTI)
            "study_instance_uid": "",
            "study_date": "",
            "study_time": "",
            "study_description":
                _decode(header.get("descrip")),
            "accession_number": "",

            # Series
            "series_instance_uid": "",
            "series_description":
                _decode(header.get("db_name")),
            "series_number": "",

            # Image / volume
            "modality": "",
            "rows": int(shape[0]) if len(shape) > 0 else 0,
            "columns": int(shape[1]) if len(shape) > 1 else 0,
            "slices": int(shape[2]) if len(shape) > 2 else 0,
            "volumes": int(shape[3]) if len(shape) > 3 else 0,
            "dimensions": len(shape),
            "datatype": str(header.get_data_dtype()),
            "bits_allocated":
                int(header.get_data_dtype().itemsize * 8),

            # Geometry
            "voxel_size": [float(z) for z in zooms],
            "slice_thickness":
                str(float(zooms[2])) if len(zooms) > 2 else "",
            "pixel_spacing":
                str([float(z) for z in zooms[:2]]),
            "spatial_units": str(header.get_xyzt_units()[0]),
            "affine": [
                [float(v) for v in row]
                for row in img.affine.tolist()
            ]
        }

    finally:
        os.unlink(tmp.name)


def _peek(source, n):
    head = source.read(n)
    source.seek(0)
    return head


def _decode(value):
    if value is None:
        return ""

    raw = bytes(value).rstrip(b"\x00")

    return raw.decode("utf-8", errors="ignore")
