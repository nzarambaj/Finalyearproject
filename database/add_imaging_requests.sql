-- Doctor-initiated imaging request flow:
--   1. doctor records patient details and submits a request
--      (exam type + clinical notes for the technician)
--   2. the patient takes the request number to the technician
--   3. technician finds the request, performs the imaging,
--      uploads the image against the request
--   4. the requesting doctor reviews the image and comments

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(50),
    address VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imaging_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    doctor_id INTEGER NOT NULL REFERENCES users(id),
    exam_type VARCHAR(50) NOT NULL,
    clinical_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    study_id INTEGER REFERENCES studies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imaging_requests_doctor
    ON imaging_requests(doctor_id);

-- Comments on a request (only the requesting doctor
-- may read or write them).
CREATE TABLE IF NOT EXISTS request_comments (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL
        REFERENCES imaging_requests(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_comments_request
    ON request_comments(request_id);

-- Uploaded studies can now belong to a request.
ALTER TABLE studies
    ADD COLUMN IF NOT EXISTS request_id
        INTEGER REFERENCES imaging_requests(id);
