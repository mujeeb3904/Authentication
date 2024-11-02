const Register = require("../model/register");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

// Function to generate a verification code
const generateVerificationCode = (length = 4) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join("");
};

// Function to validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Function to validate legal ID format
const isValidLegalId = (legalId) => /^[a-zA-Z0-9]{5,}$/.test(legalId);

// Function to validate phone number format
const isValidPhoneNumber = (phoneNumber) =>
  /^\+?[1-9]\d{1,14}$/.test(phoneNumber);

// Function to validate password format
const isValidPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    password
  );

// Create a new developer registration
const handleregisterPropertyDeveloper = asyncHandler(async (req, res) => {
  const {
    fullName,
    legalId,
    phoneNumber,
    password,
    confirmPassword,
    email,
    companyName,
    registrationNumber,
    companyAddress,
    URL,
    proofOfIncorporation,
    taxIdentificationNumber,
    companyDirectorName,
    directorId,
    businessLicenseCertificate,
    ultimateBeneficialOwner,
  } = req.body;

  // Check if all required fields are present
  const requiredFields = [
    fullName,
    legalId,
    phoneNumber,
    password,
    confirmPassword,
    email,
    companyName,
    registrationNumber,
    companyAddress,
    URL,
    proofOfIncorporation,
    taxIdentificationNumber,
    companyDirectorName,
    directorId,
    businessLicenseCertificate,
    ultimateBeneficialOwner,
  ];

  if (requiredFields.some((field) => !field)) {
    return res.status(400).json({ msg: "All required fields must be filled." });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: "Invalid email address" });
  }

  // Check if email already exists
  const existingDeveloper = await Register.findOne({ email });
  if (existingDeveloper) {
    return res.status(400).json({ msg: "Email is already in use." });
  }

  // Validate legal ID format
  if (!isValidLegalId(legalId)) {
    return res.status(400).json({ msg: "Invalid Legal ID format." });
  }

  // Validate phone number format
  if (!isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({ msg: "Invalid phone number" });
  }

  // Validate password
  if (!isValidPassword(password)) {
    return res.status(400).json({
      msg: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: "Password does not match." });
  }

  // Generate and send verification code
  const verificationCode = generateVerificationCode();

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification Request",
    text: `Your verification code is ${verificationCode}`,
  });

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new property developer registration
  const newDeveloper = new Register({
    fullName,
    legalId,
    phoneNumber,
    password: hashedPassword,
    confirmPassword: hashedPassword, // Note: confirmPassword isn't typically stored
    email,
    companyName,
    registrationNumber,
    companyAddress,
    URL,
    proofOfIncorporation,
    taxIdentificationNumber,
    companyDirectorName,
    directorId,
    businessLicenseCertificate,
    ultimateBeneficialOwner,
    verificationCode, // Store the verification code for verification later
  });

  await newDeveloper.save();

  return res.status(201).json({
    msg: "Property developer registered successfully. Verification code sent to the provided email.",
    developer: newDeveloper,
  });
});

// Verify Developer
const isDeveloperVerified = asyncHandler(async (req, res) => {
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
      user.isDeveloperVerified = true;
      user.verificationCode = null;
      await user.save();
      return res.status(200).json({ msg: "Email verification successful." });
    } else {
      return res.status(400).json({ msg: "Incorrect verification code." });
    }
  } catch (error) {
    console.error("Error verifying account:", error);
    return res.status(500).json({ msg: "Server Error" });
  }
});

// Login Developer
const handleLogInDeveloper = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Enter the required fields." });
  }

  try {
    const user = await Register.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (!user.isDeveloperVerified) {
      return res
        .status(403)
        .json({ msg: "Please verify your email before logging in." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = jwt.sign({ id: user._id }, process.env.jwtSecret);
      return res.status(200).json({ msg: "Login Successfully", token });
    } else {
      return res.status(401).json({ msg: "Incorrect password." });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ msg: "Server error." });
  }
});

// Reset Forgotten Password
const handleResetPropertyPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: "Field is required." });
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
      text: `Your request for reset key: ${verificationCode}`,
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

// Store the New Password
const handleResetNewPassword = asyncHandler(async (req, res) => {
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
    user.newPassword = hashedPassword;
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

module.exports = {
  handleregisterPropertyDeveloper,
  handleLogInDeveloper,
  isDeveloperVerified,
  handleResetPropertyPassword,
  handleResetNewPassword,
};
