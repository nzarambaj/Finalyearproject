import pydicom


def safe_get(ds, tag, default=""):
    value = ds.get(tag, default)

    if value is None:
        return default

    return str(value)


def extract_metadata(file_path):

    ds = pydicom.dcmread(file_path)

    return {

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