-- Study categories routing each modality to the specialists
-- who use it. A category maps to exactly one specialization,
-- so each (modality, specialist) pair gets its own category;
-- the technician picks the exam type and who should review it.
-- Existing categories (BRAIN MRI, CT KIDNEY -> Radiologist)
-- are left untouched.

WITH pairs (modality, specialization) AS (
    VALUES
        -- X-ray users
        ('X-RAY', 'Radiologist'),
        ('X-RAY', 'Orthopedic Surgeon'),
        ('X-RAY', 'Emergency Physician'),
        ('X-RAY', 'Trauma Surgeon'),
        ('X-RAY', 'Dentist'),
        ('X-RAY', 'Pulmonologist'),
        ('X-RAY', 'Rheumatologist'),
        ('X-RAY', 'Family Physician'),

        -- CT users
        ('CT', 'Radiologist'),
        ('CT', 'Neurosurgeon'),
        ('CT', 'Oncologist'),
        ('CT', 'Trauma Surgeon'),
        ('CT', 'Cardiologist'),
        ('CT', 'Pulmonologist'),
        ('CT', 'Urologist'),
        ('CT', 'Vascular Surgeon'),

        -- MRI users
        ('MRI', 'Neurologist'),
        ('MRI', 'Neurosurgeon'),
        ('MRI', 'Orthopedic Surgeon'),
        ('MRI', 'Oncologist'),
        ('MRI', 'Gynecologist'),
        ('MRI', 'Sports Medicine'),
        ('MRI', 'Pain Specialist'),

        -- Ultrasound users
        ('ULTRASOUND', 'Obstetrician'),
        ('ULTRASOUND', 'Gynecologist'),
        ('ULTRASOUND', 'Cardiologist (Echo)'),
        ('ULTRASOUND', 'Nephrologist'),
        ('ULTRASOUND', 'Hepatologist'),
        ('ULTRASOUND', 'Endocrinologist'),
        ('ULTRASOUND', 'Vascular Surgeon'),

        -- Mammography users
        ('MAMMOGRAPHY', 'Breast Radiologist'),
        ('MAMMOGRAPHY', 'Breast Surgeon'),
        ('MAMMOGRAPHY', 'Oncologist'),

        -- Nuclear Medicine / PET users
        ('NUCLEAR/PET', 'Nuclear Medicine Physician'),
        ('NUCLEAR/PET', 'Oncologist'),
        ('NUCLEAR/PET', 'Cardiologist'),
        ('NUCLEAR/PET', 'Neurologist')
)
INSERT INTO study_categories (name, specialization_id)
SELECT
    p.modality || ' - ' || UPPER(p.specialization),
    s.id
FROM pairs p
JOIN specializations s
    ON s.name = p.specialization
WHERE NOT EXISTS (
    SELECT 1
    FROM study_categories sc
    WHERE sc.name =
        p.modality || ' - ' || UPPER(p.specialization)
);
