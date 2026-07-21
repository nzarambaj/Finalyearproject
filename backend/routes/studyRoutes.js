const express = require("express");

const router = express.Router();

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const upload =
    require("../middleware/uploadMiddleware");

// const {
//     uploadStudy,
//     getAllStudies,
//     getStudyById
// } = require("../controllers/studyController");

const {
    uploadStudy,
    getAllStudies,
    getStudyById,
    getDoctorStudies,
    getCategories,
    getMyStudies,
    addStudyComment,
    getStudyComments
} = require("../controllers/studyController");

/*
 * Upload Study
 * Technician only
 */
router.post(
    "/upload",
    authenticateToken,
    authorizeRoles("technician"),
    upload.single("file"),
    uploadStudy
);

/*
 * List Studies
 * Doctor + Technician
 */
router.get(
    "/",
    authenticateToken,
    authorizeRoles(
        "doctor",
        "technician",
        "admin"
    ),
    getAllStudies
);

router.get(
  "/categories",
  authenticateToken,
  getCategories
);

router.get(
    "/doctor",
    authenticateToken,
    authorizeRoles("doctor"),
    getDoctorStudies
);

router.get(
  "/my-studies",
  authenticateToken,
  getMyStudies
);

router.get(
  "/doctor-studies",
  authenticateToken,
  authorizeRoles("doctor"),
  getDoctorStudies
);

/*
 * Study Comments
 * Doctors write, everyone involved reads
 */
router.post(
    "/:id/comments",
    authenticateToken,
    authorizeRoles("doctor"),
    addStudyComment
);

router.get(
    "/:id/comments",
    authenticateToken,
    authorizeRoles(
        "doctor",
        "technician",
        "admin"
    ),
    getStudyComments
);

/*
 * Study Details
 */
router.get(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "doctor",
        "technician",
        "admin"
    ),
    getStudyById
);

module.exports = router;