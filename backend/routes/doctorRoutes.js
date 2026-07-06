const express = require("express");

const router = express.Router();

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    getSpecializations,
    createProfile,
    getMyProfile
} = require("../controllers/doctorController");

router.get(
    "/specializations",
    getSpecializations
);

router.post(
    "/profile",
    authenticateToken,
    authorizeRoles("doctor"),
    createProfile
);

router.get(
    "/profile",
    authenticateToken,
    authorizeRoles("doctor"),
    getMyProfile
);

module.exports = router;