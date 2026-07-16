const path = require("path");
const FormData = require("form-data");
const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

const DICOM_SERVICE_URL =
    process.env.DICOM_SERVICE_URL ||
    "http://localhost:8000";

const PUBLIC_URL =
    process.env.PUBLIC_URL ||
    "http://localhost:5000";

/*
 * Technician upload Study
 */
exports.uploadStudy = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        const {
            category_id,
            patient_identifier
        } = req.body;

        // The DICOM service runs on a separate host, so
        // send the file bytes rather than a local path.
        const form = new FormData();

        form.append(
            "file",
            req.file.buffer,
            req.file.originalname
        );

        const dicomResponse =
            await axios.post(
                `${DICOM_SERVICE_URL}/extract`,
                form,
                {
                    headers: form.getHeaders()
                }
            );

        const metadata =
            dicomResponse.data;

        // Store the file on Cloudinary; the returned
        // URL is what goes into the database.
        const cloudinaryResult =
            await new Promise((resolve, reject) => {

                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            resource_type: "raw",
                            folder: "dicom",
                            public_id:
                                Date.now() +
                                path.extname(req.file.originalname),
                            use_filename: false
                        },
                        (error, result) =>
                            error
                                ? reject(error)
                                : resolve(result)
                    );

                stream.end(req.file.buffer);

            });

        const fileUrl = cloudinaryResult.secure_url;

        // Create study
        const studyResult = await pool.query(
            `
            INSERT INTO studies
            (
                uploaded_by,
                patient_identifier,
                category_id,
                modality,
                metadata
            )
            VALUES ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                req.user.id,
                metadata.patient_id || patient_identifier,
                category_id,
                metadata.modality,
                JSON.stringify(metadata)
            ]
        );

        const study = studyResult.rows[0];

        // Save file reference
        await pool.query(
            `
            INSERT INTO dicom_files
            (
                study_id,
                file_path
            )
            VALUES ($1,$2)
            `,
            [
                study.id,
                fileUrl
            ]
        );

        res.status(201).json({
            message: "Study uploaded successfully",
            study
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }
};

// Technician get his pending uploaded studies
exports.getMyStudies = async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.patient_identifier,
        s.modality,
        s.status,
        s.created_at,
        sc.name AS category

      FROM studies s

      JOIN study_categories sc
        ON s.category_id = sc.id

      WHERE s.uploaded_by = $1

      ORDER BY s.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};

/*
 * Get all studies
 */
exports.getAllStudies = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.patient_identifier,
                s.created_at,
                sc.name AS category,
                u.full_name AS uploaded_by
            FROM studies s
            JOIN study_categories sc
                ON s.category_id = sc.id
            JOIN users u
                ON s.uploaded_by = u.id
            ORDER BY s.created_at DESC
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }
};

/*
 * Get Study By Id
 */
exports.getStudyById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                s.*,
                sc.name AS category,
                u.full_name AS uploaded_by,
                df.file_path
            FROM studies s

            JOIN study_categories sc
                ON s.category_id = sc.id

            JOIN users u
                ON s.uploaded_by = u.id

            LEFT JOIN dicom_files df
                ON df.study_id = s.id

            WHERE s.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Study not found"
            });
        }

        const study = result.rows[0];

        if (study.file_path) {

            // New rows store a full Cloudinary URL; rows
            // from before the migration hold a local path
            // served by this server's /dicom route.
            if (study.file_path.startsWith("http")) {

                study.file_url = study.file_path;

            } else {

                const filename =
                    path.basename(study.file_path);

                study.file_url =
                    `${PUBLIC_URL}/dicom/${filename}`;
            }
        }

        res.json(study);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }
};

/*
 * Get studies assigned to doctor's specialization
 */
exports.getDoctorStudies = async (req, res) => {

    try {

        const doctorId = req.user.id;

        const result = await pool.query(
            `
            SELECT
                s.id,
                s.patient_identifier,
                s.modality,
                s.status,
                s.created_at,

                sc.id AS category_id,
                sc.name AS category,

                u.full_name AS uploaded_by

            FROM studies s

            JOIN study_categories sc
                ON s.category_id = sc.id

            JOIN doctor_profiles dp
                ON dp.specialization_id =
                   sc.specialization_id

            JOIN users u
                ON s.uploaded_by = u.id

            WHERE dp.user_id = $1

            ORDER BY s.created_at DESC
            `,
            [doctorId]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }

};

exports.getCategories = async (
  req,
  res
) => {
  try {

    const result =
      await pool.query(`
        SELECT *
        FROM study_categories
        ORDER BY name
      `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};