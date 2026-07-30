-- Priority so the worklist can flag urgent requests.
ALTER TABLE imaging_requests
    ADD COLUMN IF NOT EXISTS priority
        VARCHAR(10) DEFAULT 'normal';
