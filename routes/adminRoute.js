const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const adminModel = require('../models/admin_md');

// Create admin Route
router.post("/", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the admin already exists
        const existingAdmin = await adminModel.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "admin already exists!" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const admin = new adminModel({ email, password: hashedPassword });
        await admin.save();

        res.status(201).json({ message: "Admin created successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



// Login admin Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("%%%%%%%%%%%%", email, password)

    try {
        // Check if the admin exists
        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: "admin not found!" });
        }

        // Compare the entered password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Incorrect password!" });
        }

        res.status(200).json({ message: "Login successful!", admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
