const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`\n[REQ] 🌐 ${req.method} ${req.originalUrl}`);
    next();
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error(" MongoDB connection error:", err));

const UserSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    email:     { type: String, unique: true, required: true },
    password:  { type: String, required: true },
    reset_otp: { type: String },
    otp_expiry:{ type: Date },
    history: [{
        event:     { type: Object },
        result:    { type: Object },
        createdAt: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', UserSchema);

// =============================================
// AUTH ROUTES
// =============================================

app.post('/api/auth/register', async (req, res) => {
    try {
        console.log(`[AUTH] Processing registration for: ${req.body.email}`);
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(` Registration failed: User ${email} already exists`);
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        console.log(`User registered successfully: ${email}`);
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

// OTP store
const otpStore = {};

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.EMAIL_PORT || 2525,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/login-request', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login request for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid password" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 300000 };

        await transporter.sendMail({
            from: '"Event Sense" <no-reply@eventsense.com>',
            to: email,
            subject: "Your Login OTP Code",
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #6366f1;">Event Sense Verification</h2>
                    <p>Your OTP for login is:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #1e293b;">${otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                </div>
            `
        });

        console.log(` OTP sent to: ${email}`);
        res.json({ message: "OTP sent to your email" });
    } catch (err) {
        console.error(" Request error:", err.message);
        res.status(500).json({ error: "Failed to send OTP", details: err.message });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const record = otpStore[email];

        if (!record) return res.status(400).json({ error: "Session expired. Please login again." });
        if (Date.now() > record.expires) { delete otpStore[email]; return res.status(400).json({ error: "OTP expired" }); }
        if (record.otp !== otp) return res.status(401).json({ error: "Invalid OTP code" });

        const user = await User.findOne({ email });
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        delete otpStore[email];
        console.log(` Login successful: ${email}`);
        res.json({ message: "Login successful", token, user: { name: user.name, email: user.email } });
    } catch (err) {
        console.error(" Verification error:", err.message);
        res.status(500).json({ error: "Verification failed" });
    }
});

// =============================================
// HISTORY ROUTES
// =============================================

app.get('/api/history', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            console.log("History request denied: No token provided");
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
        console.log(`[API] Fetching history for user ID: ${decoded.userId}`);

        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log(" History request failed: User not found in DB");
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`History retrieved successfully (${user.history.length} records)`);
        res.json({ history: user.history || [] });
    } catch (err) {
        console.error(" History retrieval error:", err.message);
        res.status(401).json({ error: "Invalid token" });
    }
});

// POST /api/history — save new prediction + send email summary
app.post('/api/history', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { event, result } = req.body;
        if (!event || !result) return res.status(400).json({ error: "event and result required" });

        user.history.push({ event, result, createdAt: new Date() });
        await user.save();
        console.log(`[API] ✅ History saved for user ${decoded.userId}`);

        // ✅ Calculate same values as Dashboard (breakdownSum based)
        const breakdown = result.breakdown || {};
        const breakdownSum = Object.values(breakdown).reduce((a, b) => a + Number(b), 0);
        const userBudget = Number(result.max_budget || result.userInputBudget || 0);
        const optimizedBudget = userBudget - breakdownSum;
        const isOver = optimizedBudget < 0;
        const statusColor = isOver ? '#ef4444' : '#10b981';
        const statusText = isOver ? ' Over Budget' : 'Within Budget';

        // Build breakdown HTML rows
        const breakdownRows = Object.entries(breakdown).map(([svc, cost]) => `
            <tr>
                <td style="padding:8px 12px; text-transform:capitalize; border-bottom:1px solid #f1f5f9;">${svc}</td>
                <td style="padding:8px 12px; text-align:right; border-bottom:1px solid #f1f5f9; font-weight:600;">LKR ${Number(cost).toLocaleString()}</td>
            </tr>
        `).join('');

        //  Breakdown total row
        const breakdownTotalRow = breakdownRows ? `
            <tr style="background:#f8fafc; font-weight:700; border-top:2px solid #e2e8f0;">
                <td style="padding:8px 12px;">Total</td>
                <td style="padding:8px 12px; text-align:right; color:#1d4ed8;">LKR ${Math.round(breakdownSum).toLocaleString()}</td>
            </tr>
        ` : '';

        // Build vendors HTML rows
        const vendors = result.vendors || [];
        const vendorRows = vendors.map(v => `
            <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9;">${v.service}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; font-weight:600;">${v.name || 'N/A'}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#6366f1;">${v.contact || 'N/A'}</td>
            </tr>
        `).join('');

        // Send email
        try {
            await transporter.sendMail({
                from: '"Event Sense" <no-reply@eventsense.com>',
                to: user.email,
                subject: `Your Event Budget Prediction Summary — ${event.event_type || 'Event'}`,
                html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width:620px; margin:auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:28px 32px;">
                        <h1 style="color:#fff; margin:0; font-size:22px; letter-spacing:0.5px;">Event <span style="opacity:0.85;">Sense</span></h1>
                        <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px;">AI Budget Prediction Summary</p>
                    </div>

                    <!-- Event Info -->
                    <div style="padding:24px 32px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                        <h2 style="margin:0 0 16px; font-size:16px; color:#1e293b;">Event Details</h2>
                        <table style="width:100%; font-size:14px; color:#475569;">
                            <tr><td style="padding:4px 0; width:140px;">Event Type</td><td style="font-weight:600; color:#1e293b;">${result.event_type || event.event_type || '—'}</td></tr>
                            <tr><td style="padding:4px 0;">Location</td><td style="font-weight:600; color:#1e293b;">${result.location || '—'}</td></tr>
                            <tr><td style="padding:4px 0;">Guests</td><td style="font-weight:600; color:#1e293b;">${result.num_guests || '—'}</td></tr>
                            <tr><td style="padding:4px 0;">Your Budget</td><td style="font-weight:600; color:#1e293b;">LKR ${userBudget.toLocaleString()}</td></tr>
                        </table>
                    </div>

                    <!-- Cost Summary -->
                    <div style="padding:24px 32px; border-bottom:1px solid #e2e8f0;">
                        <h2 style="margin:0 0 16px; font-size:16px; color:#1e293b;">Cost Summary</h2>
                        <table style="width:100%; font-size:14px; color:#475569; border-collapse:collapse;">
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px 0; width:50%;">Your Budget</td>
                                <td style="font-weight:700; font-size:16px; color:#2563eb;">LKR ${userBudget.toLocaleString()}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px 0;">Predicted Total</td>
                                <td style="font-weight:700; font-size:16px; color:#1e293b;">LKR ${Math.round(breakdownSum).toLocaleString()}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px 0;">Optimized Budget</td>
                                <td style="font-weight:700; font-size:16px; color:${statusColor};">LKR ${Math.round(Math.abs(optimizedBudget)).toLocaleString()}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:8px 0;">Budget Status</td>
                                <td style="font-weight:700; color:${statusColor};">${statusText}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;">Difference</td>
                                <td style="font-weight:600; color:#64748b;">
                                    LKR ${Math.round(Math.abs(optimizedBudget)).toLocaleString()}
                                    <span style="font-size:11px; color:#94a3b8; margin-left:4px;">(${isOver ? 'over by' : 'remaining'})</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Service Breakdown -->
                    ${breakdownRows ? `
                    <div style="padding:24px 32px; border-bottom:1px solid #e2e8f0;">
                        <h2 style="margin:0 0 16px; font-size:16px; color:#1e293b;">Service Breakdown</h2>
                        <table style="width:100%; font-size:14px; color:#475569; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f1f5f9;">
                                    <th style="padding:8px 12px; text-align:left; font-weight:600; color:#1e293b;">Service</th>
                                    <th style="padding:8px 12px; text-align:right; font-weight:600; color:#1e293b;">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${breakdownRows}
                                ${breakdownTotalRow}
                            </tbody>
                        </table>
                    </div>` : ''}

                    <!-- Vendor Recommendations -->
                    ${vendorRows ? `
                    <div style="padding:24px 32px; border-bottom:1px solid #e2e8f0;">
                        <h2 style="margin:0 0 16px; font-size:16px; color:#1e293b;">Recommended Vendors</h2>
                        <table style="width:100%; font-size:14px; color:#475569; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f1f5f9;">
                                    <th style="padding:8px 12px; text-align:left; font-weight:600; color:#1e293b;">Service</th>
                                    <th style="padding:8px 12px; text-align:left; font-weight:600; color:#1e293b;">Vendor</th>
                                    <th style="padding:8px 12px; text-align:left; font-weight:600; color:#1e293b;">Contact</th>
                                </tr>
                            </thead>
                            <tbody>${vendorRows}</tbody>
                        </table>
                    </div>` : ''}

                    <!-- Footer -->
                    <div style="padding:20px 32px; background:#f8fafc; text-align:center;">
                        <p style="margin:0; font-size:12px; color:#94a3b8;">Generated by Event Sense AI • This is an automated summary</p>
                    </div>
                </div>
                `
            });
            console.log(`Summary sent to: ${user.email}`);
        } catch (emailErr) {
            console.warn(` Email send failed (non-critical):`, emailErr.message);
        }

        res.json({ message: "History saved successfully" });
    } catch (err) {
        console.error("History save error:", err.message);
        res.status(500).json({ error: "Failed to save history" });
    }
});

// =============================================
// PREDICT ROUTE (proxy to Flask + auto-save history)
// =============================================

app.post('/api/predict', async (req, res) => {
    try {
        console.log(" Prediction request received. Forwarding to Flask...");
        const token = req.headers.authorization?.split(' ')[1];
        let userId = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
                userId = decoded.userId;
            } catch (e) {
                console.log(" Token verification failed");
            }
        }

        const flaskResponse = await axios.post('http://127.0.0.1:5001/predict', req.body);
        const predictionData = flaskResponse.data;

        if (userId) {
            const breakdown = predictionData.breakdown || {};
            const calculatedTotal = Object.values(breakdown).reduce((acc, val) => acc + Number(val), 0);
            const userInputBudget = Number(req.body.max_budget);
            const optimizedBalance = userInputBudget - calculatedTotal;

            const finalResultToSave = {
                ...predictionData,
                userInputBudget,
                predicted_total: calculatedTotal,
                difference: optimizedBalance,
                event_type: req.body.event_type,
                location: req.body.location,
                num_guests: req.body.num_guests,
                max_budget: req.body.max_budget,
            };

            await User.findByIdAndUpdate(userId, {
                $push: {
                    history: {
                        event: req.body,
                        result: finalResultToSave,
                        createdAt: new Date()
                    }
                }
            });

            console.log(` Prediction saved for user: ${userId}`);
            res.json(finalResultToSave);
        } else {
            res.json(predictionData);
        }
    } catch (err) {
        console.error(" Error:", err.message);
        res.status(500).json({ error: "AI Server connection failed" });
    }
});

// =============================================
// ADMIN FUNCTION
// =============================================

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        console.log(`[ADMIN] Fetching all users... Found: ${users.length}`);
        res.json(users);
    } catch (err) {
        console.error("[ADMIN API] ❌ Error:", err.message);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// =============================================
// PASSWORD RESET
// =============================================

app.post('/api/forgot-password-request', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.reset_otp = resetToken;
        user.otp_expiry = Date.now() + 30 * 60 * 1000;
        await user.save();

        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        await transporter.sendMail({
            from: '"Event Sense" <no-reply@eventsense.com>',
            to: email,
            subject: 'Reset Your Event Sense Password',
            html: `
            <div style="font-family:'Segoe UI',sans-serif; max-width:580px; margin:auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.09);">

                <div style="background:linear-gradient(135deg,#1a1408 0%,#2d2000 50%,#1a1a0e 100%); padding:36px 40px; text-align:center;">
                    <h1 style="color:#fff; margin:0; font-size:26px; font-weight:900; letter-spacing:1px;">
                        Event <span style="color:#c9a84c;">Sense</span>
                    </h1>
                    <p style="color:rgba(201,168,76,0.75); margin:8px 0 0; font-size:13px; letter-spacing:0.05em;">
                        AI-Powered Budget Planner
                    </p>
                </div>

                <div style="padding:40px 40px 32px;">
                    <div style="text-align:center; font-size:40px; margin-bottom:20px;">🔐</div>

                    <h2 style="text-align:center; margin:0 0 12px; font-size:20px; font-weight:800; color:#1a1a1a;">
                        Password Reset Request
                    </h2>
                    <p style="text-align:center; color:#666; font-size:14px; line-height:1.7; margin:0 0 32px;">
                        We received a request to reset the password for your Event Sense account.<br/>
                        Click the button below to set a new password.
                    </p>

                    <div style="text-align:center; margin-bottom:32px;">
                        <a href="${resetLink}"
                           style="display:inline-block; padding:15px 40px; border-radius:14px;
                                  background:linear-gradient(135deg,#1a1408 0%,#c9a84c 60%,#e2be6e 100%);
                                  color:#fff8e1; font-weight:800; font-size:15px; text-decoration:none;
                                  letter-spacing:0.05em; box-shadow:0 6px 24px rgba(201,168,76,0.4);">
                            Reset My Password
                        </a>
                    </div>

                    <div style="background:#f9f8f6; border:1.5px solid rgba(201,168,76,0.2); border-radius:10px; padding:14px 18px; margin-bottom:28px;">
                        <p style="margin:0; font-size:13px; color:#888; text-align:center;">
                            ⏱ This link will expire in <strong style="color:#1a1a1a;">30 minutes</strong>.
                            If you did not request this, you can safely ignore this email.
                        </p>
                    </div>

                    <p style="font-size:12px; color:#aaa; text-align:center; margin:0;">
                        If the button does not work, copy and paste this link:<br/>
                        <a href="${resetLink}" style="color:#c9a84c; word-break:break-all;">${resetLink}</a>
                    </p>
                </div>

                <div style="padding:20px 40px; background:#f9f8f6; border-top:1.5px solid rgba(0,0,0,0.05); text-align:center;">
                    <p style="margin:0; font-size:12px; color:#bbb;">
                        © Event Sense AI • This is an automated message, please do not reply.
                    </p>
                </div>
            </div>
            `
        });

        res.json({ message: 'Reset link sent!' });
    } catch (err) {
        console.error("Save Error:", err.message);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.post('/api/reset-password-final', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        console.log(`[RESET] Token received: ${token ? token.substring(0,16) + '...' : 'MISSING'}`);
        if (!token) return res.status(400).json({ error: "No token provided" });

        const user = await User.findOne({ reset_otp: token });
        console.log(`[RESET] User found: ${user ? user.email : 'NOT FOUND'}`);
        if (!user) return res.status(400).json({ error: "Invalid reset link — token not found or already used" });

        console.log(`[RESET] Expiry: ${user.otp_expiry}, Now: ${new Date()}`);
        if (user.otp_expiry && Date.now() > new Date(user.otp_expiry).getTime()) {
            return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.reset_otp = null;
        user.otp_expiry = null;
        await user.save();

        console.log("[AUTH] Password updated for:", user.email);
        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        console.error("Reset Error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// =============================================
// DIRECT LOGIN 
// =============================================

app.post('/api/login-request', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        console.log(`Login successful: ${email}`);
        res.json({ 
            message: "Login successful", 
            token, 
            user: { name: user.name, email: user.email } 
        });
    } catch (err) {
        console.error(" Login error:", err.message);
        res.status(500).json({ error: "Login failed" });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const record = otpStore[email];

        if (!record) {
            return res.status(400).json({ error: "Session expired. Please login again." });
        }

        
        if (Date.now() > record.expires) {
            delete otpStore[email];
            return res.status(400).json({ error: "OTP expired" });
        }

       
        if (record.otp !== otp) {
            return res.status(401).json({ error: "Invalid OTP code" });
        }

        
        const user = await User.findOne({ email });
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key-change-this',
            { expiresIn: '24h' }
        );

        
        delete otpStore[email];

        console.log(`Login successful: ${email}`);
        res.json({ 
            message: "Login successful", 
            token, 
            user: { name: user.name, email: user.email } 
        });

    } catch (err) {
        console.error("Verification error:", err.message);
        res.status(500).json({ error: "Verification failed" });
    }
});

// =============================================
// DIRECT PASSWORD RESET 
// =============================================

app.post('/api/reset-password-direct', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) return res.status(400).json({ error: "Email and new password required" });
        if (newPassword.length < 6)  return res.status(400).json({ error: "Password must be at least 6 characters" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "No account found with this email" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        console.log(`Direct password reset for: ${email}`);
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Direct reset error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// =============================================
// PROFILE UPDATE
// =============================================

app.put('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: "No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const { name, newPassword } = req.body;

        if (name) user.name = name;

        if (newPassword) {
            if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
            user.password = await bcrypt.hash(newPassword, 10);
            console.log(`[AUTH] ✅ Password changed for: ${user.email}`);
        }

        await user.save();
        console.log(`[AUTH] ✅ Profile updated for: ${user.email}`);
        res.json({ message: "Profile updated successfully", name: user.name });
    } catch (err) {
        console.error("[AUTH] ❌ Profile update error:", err.message);
        res.status(500).json({ error: "Update failed" });
    }
});


// =============================================
// ADMIN ROUTES
// =============================================

// GET all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password -reset_otp -otp_expiry');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// DELETE user 
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`[ADMIN] User deleted: ${deletedUser.email}`);
        res.json({ 
            message: "User deleted successfully", 
            deletedUser: { name: deletedUser.name, email: deletedUser.email } 
        });
    } catch (err) {
        console.error("[DELETE ERROR]", err);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// =============================================
// START SERVER
// =============================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[SYSTEM] 🚀 Node server running on port ${PORT}`));