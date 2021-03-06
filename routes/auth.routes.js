const {Router} = require('express');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const User = require('../models/User');
const router = Router();


// /api/auth/register
router.post(
    '/register',
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'The minimum length of password is 6')
            .isLength({ min: 6 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: errors[0] || 'Incorrect register data'
                });
            }
            const {email, password} = req.body;
            const candidate = await User.findOne({ email });

            if (candidate) {
                return res.status(400).json({ message: 'Such user already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({ email, password: hashedPassword });

            await user.save();
            res.status(201).json({ message: 'The user is created' });

        } catch (e) {
            res.status(500).json({ message: 'Error is occurred. Try again' });
        }
    })

// /api/auth/login
router.post(
    '/login',
    [
        check('email', 'Type email').isEmail(),
        check('password', 'Type password').exists()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: errors[0] || 'Incorrect data when log in is occurred'
                })
            }

            const {email, password} = req.body;
            console.log(email)
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ message: 'The user is not found' });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect password. Try again' });
            }

            const token = jwt.sign(
                { userId: user.id },
                config.get('jwtSecret'),
                { expiresIn: '1h' }
            )

            res.json({ token, userId: user.id, email });

        } catch (e) {
            res.status(500).json({ message: 'Error is occurred. Try again' });
        }
    })


module.exports = router;
