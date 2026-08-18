-- AVM (or other) segmentation overlay for a study.
-- The mask is produced externally (ITK-SNAP / 3D Slicer),
-- registered to the CT, and stored as a NIfTI on Cloudinary.
ALTER TABLE studies
    ADD COLUMN IF NOT EXISTS overlay_url TEXT;
