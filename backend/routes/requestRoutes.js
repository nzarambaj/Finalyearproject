const express = require("express");

const router = express.Router();

const authenticateToken =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const upload =
    require("../middleware/uploadMiddleware");

const {
    createRequest,
    getRequests,
    getRequestById,
    uploadRequestImage,
    getRequestComments,
    addRequestComment
} = require("../controllers/requestController");

/*
 * Doctor submits an imaging request
 */
router.post(
    "/",
    authenticateToken,
    authorizeRoles("doctor"),
    createRequest
);

/*
 * List all requests (searchable)
 */
router.get(
    "/",
    authenticateToken,
    authorizeRoles(
        "doctor",
        "technician",
        "admin"
    ),
    getRequests
);

/*
 * Technician uploads the image for a request
 */
router.post(
    "/:id/upload",
    authenticateToken,
    authorizeRoles("technician"),
    upload.single("file"),
    uploadRequestImage
);

/*
 * Comments (requesting doctor only)
 */
router.get(
    "/:id/comments",
    authenticateToken,
    authorizeRoles("doctor"),
    getRequestComments
);

router.post(
    "/:id/comments",
    authenticateToken,
    authorizeRoles("doctor"),
    addRequestComment
);

/*
 * Request details
 */
router.get(
    "/:id",
    authenticateToken,
    authorizeRoles(
        "doctor",
        "technician",
        "admin"
    ),
    getRequestById
);

module.exports = router;
