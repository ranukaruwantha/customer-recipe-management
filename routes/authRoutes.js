const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/userModel');

// POST route for user registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body; // Include email

    try {
        // Check if the user already exists
        let user = await User.findOne({ email }); // Check by email
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create a new user instance
        user = new User({ username, email, password: await bcrypt.hash(password, 10) });
        await user.save();

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST route for user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check if fields are provided
    if (!username || !password) {
        return res.status(400).json({ msg: 'Please provide username and password' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Return the username along with the token
        res.json({ token, username: user.username });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
