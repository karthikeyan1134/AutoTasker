const express = require("express");
const { google } = require("googleapis");
const router = express.Router();

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI ||
		"http://localhost:5000/auth/google/callback"
);

const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/spreadsheets",
	"https://www.googleapis.com/auth/calendar",
	"https://www.googleapis.com/auth/userinfo.profile",
	"https://www.googleapis.com/auth/userinfo.email",
];

// Initiate Google OAuth
router.get("/google", (req, res) => {
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
		prompt: "consent",
	});
	res.redirect(authUrl);
});

// Handle OAuth callback
router.get("/google/callback", async (req, res) => {
	const { code } = req.query;
	try {
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);
		const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
		const { data: userInfo } = await oauth2.userinfo.get();
		req.session.user = {
			id: userInfo.id,
			email: userInfo.email,
			name: userInfo.name,
			picture: userInfo.picture,
		};
		req.session.tokens = tokens;
		console.log(`✅ User authenticated: ${userInfo.email}`);
		const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
		res.redirect(`${frontendURL}/dashboard?auth=success`);
	} catch (error) {
		console.error("❌ OAuth error:", error);
		const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
		res.redirect(`${frontendURL}/auth?error=oauth_failed`);
	}
});

// Get current user
router.get("/user", (req, res) => {
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}
	res.json({
		user: req.session.user,
		authenticated: true,
	});
});

// Logout
router.post("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({ error: "Logout failed" });
		}
		res.clearCookie("connect.sid");
		res.json({ message: "Logged out successfully" });
	});
});

// Check authentication status
router.get("/status", (req, res) => {
	res.json({
		authenticated: !!req.session.user,
		user: req.session.user || null,
	});
});

module.exports = router;
