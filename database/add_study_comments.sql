-- Comments doctors leave on a study:
--   Radiologist  -> findings about the study image
--   Other specialists -> recommendation on what examination
--                        the technician should take
CREATE TABLE IF NOT EXISTS study_comments (
    id SERIAL PRIMARY KEY,
    study_id INTEGER NOT NULL
        REFERENCES studies(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL
        REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_comments_study_id
    ON study_comments(study_id);
