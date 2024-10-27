const express = require("express");
const mongoose = require("mongoose");

const app = express();
const port = 6000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/auth")
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("Mongo Error", err));

// Define User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Create User Model
const User = mongoose.model("User", userSchema);

// Login route
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are Entered by user
    if (!email || !password) {
        return res.status(400).json({ msg: "All fields are required." });
    }

    try {
        // Check if user exists with the provided DB email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found." });
        }

        // Check if password matches
        if (password !== user.password) {
            return res.status(401).json({ msg: "Incorrect password." });
        }

        // Successful login
        return res.status(200).json({ msg: "Login successful", user });
    } catch (error) {
        console.error("Error during login", error);
        return res.status(500).json({ msg: "Server error during login" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
