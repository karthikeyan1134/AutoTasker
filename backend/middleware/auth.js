const { google } = require("googleapis");

const requireAuth = (req, res, next) => {
	if (!req.session.user || !req.session.tokens) {
		return res.status(401).json({
			error: "Authentication required",
			redirect: "/auth/google",
		});
	}
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI
	);
	oauth2Client.setCredentials(req.session.tokens);
	next();
};

module.exports = { requireAuth };
