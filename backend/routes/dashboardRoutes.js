const express = require("express");
const router = express.Router();

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

router.get(
    "/doctor",
    authenticateToken,
    authorizeRoles("doctor"),
    (req, res) => {

        res.json({
            message: "Doctor dashboard",
            user: req.user
        });

    }
);

router.get(
    "/technician",
    authenticateToken,
    authorizeRoles("technician"),
    (req, res) => {

        res.json({
            message: "Technician dashboard",
            user: req.user
        });

    }
);

module.exports = router;