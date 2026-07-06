const path = require("path");
const pool = require("../config/db");
const axios = require("axios");

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

        const filePath = req.file.path;

        const absolutePath =
            require("path").resolve(filePath);

        const dicomResponse =
            await axios.post(
                "http://localhost:8000/extract",
                {
                    file_path: absolutePath
                }
            );

        const metadata =
            dicomResponse.data;

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
                filePath
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

            const filename =
                path.basename(study.file_path);

            study.file_url =
                `http://localhost:5000/dicom/${filename}`;
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