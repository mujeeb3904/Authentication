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

// Define User Schema with timestamps
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        unique: true
    }
}, { timestamps: true });

// Create User Model
const User = mongoose.model("User", userSchema);

// Route to display all users
app.get("/api/auth/register", async (req, res) => {
    try {
        const allDBUsers = await User.find({});
        const html = `
            <ul>
                ${allDBUsers.map(user => `<li>${user.userName} - ${user.email} - ${user.contactNumber}</li>`).join("")}
            </ul>
        `;
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users");
    }
});

// Get user by ID
app.get("/api/auth/register/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error fetching user" });
    }
});

// Route to add a new user
app.post("/api/auth/register", async (req, res) => {
    const body = req.body;

    // Validate required fields
    if (!body.email || 
        !body.userName || 
        !body.password || 
        !body.confirmPassword || 
        !body.contactNumber) 
        {
        return res.status(400).json({ msg: "All fields are required!" });
    }

    // Validate email format
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(body.email.toLowerCase())) {
        return res.status(400).json({ msg: `${body.email} is not a valid email address.` });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (!passwordRegex.test(body.password)) {
        return res.status(400).json({ msg: "Password must be between 6 to 20 characters, contain at least one numeric digit, one lowercase letter, and one uppercase letter." });
    }

    // Check if passwords match
    if (body.password !== body.confirmPassword) {
        return res.status(400).json({ msg: "Password does not match." });
    }

    //  Phone number Validation 
    const contactRegex = /^03\d{2}[- ]?\d{7}$/;
    if(!contactRegex.test(body.contactNumber)){
        return res.status(400).json({msg: "Phone Number is not valid."})
    }



    // Check if userName is already exist 

    // const existingUserName = await User.findOne({userName: body.userName});
    // if (existingUserName){
    //     return res.status(401).json({msg: "User name already exists"})
    // }


    try {
        // Check if the email already exists
        const existingUser = await User.findOne({ email: body.email });
        if (existingUser) {
            return res.status(400).json({ msg: "Email already exists." });
        }

    


        // Create new user
        const newUser = await User.create({
            userName: body.userName,
            email: body.email,
            password: body.password,  // Ideally, hash the password here
            contactNumber: body.contactNumber,
        });

        console.log("User created:", newUser);
        return res.status(201).json({ msg: "Registration successful!", user: newUser });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ msg: "Error creating user", error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
