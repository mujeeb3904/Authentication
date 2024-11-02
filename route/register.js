const express = require("express");
const router = express.Router();

// Investor
const {
  handleRegisterNewUser,
  handleLogInUser,
  isVerified,
  handleResendCode,
  handleResetPassword,
  handleNewPassword,
  handleGetInvestorProfile,
  handleUploadProfileImage,
  upload,
} = require("../controller/invester");

// Property Developer

const {
  handleregisterPropertyDeveloper,
  handleLogInDeveloper,
  isDeveloperVerified,
  handleResetPropertyPassword,
  handleResetNewPassword,
} = require("../controller/propertyDeveloper");

const authenticateToken = require("../middleware/token");

router.get("/protected-route", authenticateToken, (req, res) => {
  res.json("This is a protected route. User authenticated!");
});

router.post("/sign-up", handleRegisterNewUser);
router.post("/login", handleLogInUser);
router.post("/verification", isVerified);
router.post("/resend-code", handleResendCode);
router.post("/reset-password", handleResetPassword);
router.post("/new-password", handleNewPassword);
router.post("/register-property-developer", handleregisterPropertyDeveloper);
router.post("/login-developer", handleLogInDeveloper);
router.post("/developer-verification", isDeveloperVerified);
router.post("/reset-developer-password", handleResetPropertyPassword);
router.post("/reset-new-password", handleResetNewPassword);
// investor profile
router.get("/investor-profile/:id", handleGetInvestorProfile);
router.post("/profile-image", upload.single("file"), handleUploadProfileImage);

module.exports = router;
