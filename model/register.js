const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
    },
    legalId: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    origin: {
      type: String,
    },
    password: {
      type: String,
      required: false,
    },
    confirmPassword: {
      type: String,
      required: false,
    },
    newPassword: {
      type: String,
    },
    isVerified: {
      type: Boolean,
    },
    isDeveloperVerified: {
      type: Boolean,
    },
    verificationCode: {
      type: String,
    },

    // Company information
    companyName: {
      type: String,
      required: false,
    },
    registrationNumber: {
      type: String,
      required: false,
    },
    companyAddress: {
      type: String,
      required: false,
    },
    URL: {
      type: String,
      required: false,
    },
    proofOfIncorporation: {
      type: String,
      required: false,
    },
    taxIdentificationNumber: {
      type: String,
      required: false,
    },

    // Director information
    companyDirectorName: {
      type: String,
      required: false,
    },
    directorId: {
      type: String,
      required: false,
    },
    businessLicenseCertificate: {
      type: String,
      required: false,
    },
    ultimateBenificalOwner: {
      type: String,
      required: false,
    },
    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Register", registerSchema);
