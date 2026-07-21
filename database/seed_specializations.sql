-- Specializations by imaging modality usage:
--   X-ray:        Radiologist, Orthopedic Surgeon, Emergency Physician, Trauma Surgeon,
--                 Dentist, Pulmonologist, Rheumatologist, Family Physician
--   CT:           Radiologist, Neurosurgeon, Oncologist, Trauma Surgeon, Cardiologist,
--                 Pulmonologist, Urologist, Vascular Surgeon
--   MRI:          Neurologist, Neurosurgeon, Orthopedic Surgeon, Oncologist, Gynecologist,
--                 Sports Medicine, Pain Specialist
--   Ultrasound:   Obstetrician, Gynecologist, Cardiologist (Echo), Nephrologist,
--                 Hepatologist, Endocrinologist, Vascular Surgeon
--   Mammography:  Breast Radiologist, Breast Surgeon, Oncologist
--   Nuclear/PET:  Nuclear Medicine Physician, Oncologist, Cardiologist, Neurologist

BEGIN;

-- Rename the legacy Radiographer row so existing doctor_profiles and
-- study_categories keep their specialization_id links.
UPDATE specializations
SET name = 'Radiologist'
WHERE name = 'Radiographer';

INSERT INTO specializations (name) VALUES
    ('Radiologist'),
    ('Orthopedic Surgeon'),
    ('Emergency Physician'),
    ('Trauma Surgeon'),
    ('Dentist'),
    ('Pulmonologist'),
    ('Rheumatologist'),
    ('Family Physician'),
    ('Neurosurgeon'),
    ('Oncologist'),
    ('Cardiologist'),
    ('Urologist'),
    ('Vascular Surgeon'),
    ('Neurologist'),
    ('Gynecologist'),
    ('Sports Medicine'),
    ('Pain Specialist'),
    ('Obstetrician'),
    ('Cardiologist (Echo)'),
    ('Nephrologist'),
    ('Hepatologist'),
    ('Endocrinologist'),
    ('Breast Radiologist'),
    ('Breast Surgeon'),
    ('Nuclear Medicine Physician')
ON CONFLICT (name) DO NOTHING;

COMMIT;
