const Register = require("../model/register");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

require("dotenv").config();

// Configure transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

// Function for generating a verification code
function generateVerificationCode(length = 4) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
}

// Create New account
const handleRegisterNewUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    legalId,
    origin,
    email,
    phoneNumber,
    password,
    confirmPassword,
  } = req.body;

  if (
    !fullName ||
    !legalId ||
    !origin ||
    !email ||
    !phoneNumber ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({ msg: "All fields are required." });
  }
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email address" });
  }
  // Passport and Legal Id validation
  const legalIdRegex = /^[a-zA-Z0-9]{5,}$/;
  if (!legalIdRegex.test(legalId)) {
    return res.status(400).json({ msg: "Invalid Legal ID format." });
  }
  // Phone Number Validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ msg: "Invalid phone number" });
  }
  // Password Validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      msg: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ msg: "Password does not match." });
  }

  const existingUser = await Register.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ msg: "Email is already in use. Please log in." });
  }

  const verificationCode = generateVerificationCode();

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification Request",
    text: `Your verification code is ${verificationCode}`,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new Register({
    fullName,
    legalId,
    origin,
    email,
    phoneNumber,
    password: hashedPassword,
    confirmPassword: hashedPassword,
    verificationCode,
    isVerified: false,
  });

  await newUser.save();

  return res.status(201).json({
    msg: "Account created successfully. Verification code sent to provided email.",
    user: newUser,
  });
});

// User Verification
async function isVerified(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ msg: "Email and verification code are required." });
  }

  try {
    const user = await Register.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    if (user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = null;
      await user.save();

      return res.status(200).json({ msg: "Email verification successful." });
    } else {
      return res
        .status(400)
        .json({ msg: "The verification code you entered is incorrect." });
    }
  } catch (error) {
    console.error("Error verifying account:", error);
    return res.status(500).json({ msg: "Server Error" });
  }
}

// Resend Verification Code
const handleResendCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: "Email is required." });
  }

  const user = await Register.findOne({ email });
  if (!user) {
    return res.status(404).json({ msg: "No user found." });
  }

  const verificationCode = generateVerificationCode();
  user.verificationCode = verificationCode;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Email Verification Request",
      text: `Your verification code is ${verificationCode}`,
    });

    await user.save();

    return res
      .status(200)
      .json({ msg: "Verification code sent successfully." });
  } catch (error) {
    return res.status(500).json({
      msg: "Failed to send verification email.",
      error: error.message,
    });
  }
});

// Log in
async function handleLogInUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Enter the required fields." });
  }

  try {
    const user = await Register.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ msg: "Please verify your email before logging in." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const jwtSecret = process.env.jwtSecret;
      const token = jwt.sign({ id: user._id }, jwtSecret);
      return res.status(200).json({ msg: "Login Successfully", token: token });
    } else {
      return res.status(401).json({ msg: "Incorrect password." });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ msg: "Server error." });
  }
}

// Forget Password

const handleResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(404).json({ msg: "Field are Required." });
  }

  const user = await Register.findOne({ email });
  if (!user) {
    return res.status(404).json({ msg: "No user found." });
  }

  const verificationCode = generateVerificationCode();
  user.verificationCode = verificationCode;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Forget Password Request",
      text: `Your request for reset key:  ${verificationCode}`,
    });

    await user.save();

    return res.status(200).json({ msg: "Forget key send successfully." });
  } catch (error) {
    return res.status(500).json({
      msg: "Failed to send forget password key.",
      error: error.message,
    });
  }
});

// Store forget New Password
const handleNewPassword = asyncHandler(async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ msg: "All fields are required." });
  }

  try {
    const user = await Register.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ msg: "Invalid verification code." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.verificationCode = null;
    await user.save();

    return res.status(200).json({ msg: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({
      msg: "Error creating new password",
      error: error.message,
    });
  }
});
// Investor Profile
const handleGetInvestorProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Register.findById(userId).select(
      "fullName email origin"
    );
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    // Format user profile data for the response
    const userProfile = {
      fullName: user.fullName,
      email: user.email,
      origin: user.origin,
    };

    return res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ msg: "Server Error" });
  }
});

// Investor Profile Image with Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "D:/Authentication Flow/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
// Create the multer upload middleware
const upload = multer({ storage });
// Define the upload handler function
const handleUploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.send("File uploaded successfully");
});

module.exports = {
  handleRegisterNewUser,
  handleLogInUser,
  isVerified,
  handleResendCode,
  handleResetPassword,
  handleNewPassword,
  handleGetInvestorProfile,
  handleUploadProfileImage,
  upload,
};
