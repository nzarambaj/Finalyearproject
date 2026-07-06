const pool = require("../config/db");

exports.getSpecializations = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM specializations ORDER BY name"
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

exports.createProfile = async (req, res) => {

    try {

        const { specialization_id } = req.body;

        const result = await pool.query(
            `
            INSERT INTO doctor_profiles
            (user_id, specialization_id)
            VALUES ($1, $2)
            RETURNING *
            `,
            [
                req.user.id,
                specialization_id
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

exports.getMyProfile = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.email,
                s.name AS specialization
            FROM users u
            JOIN doctor_profiles dp
                ON u.id = dp.user_id
            JOIN specializations s
                ON dp.specialization_id = s.id
            WHERE u.id = $1
            `,
            [req.user.id]
        );

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};