const router = require("express").Router();
const { body } = require("express-validator");
const { login, register, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required."),
    body("password").notEmpty().withMessage("Password required."),
  ],
  login
);

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name required."),
    body("email").isEmail().withMessage("Valid email required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  register
);

// POST /api/auth/logout  (protected)
router.post("/logout", protect, logout);

module.exports = router;
