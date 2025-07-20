const express = require("express");
const { google } = require("googleapis");
const { classifyEmail } = require("../utils/gemini");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.use(requireAuth);

// Fetch and process job emails
router.get("/jobs", async (req, res) => {
	try {
		const { days = 7, maxResults = 50 } = req.query;
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const gmail = google.gmail({ version: "v1", auth: oauth2Client });
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - parseInt(days));
		const dateStr = startDate.toISOString().split("T")[0].replace(/-/g, "/");
		const jobTerms = [
			"job opportunity",
			"internship",
			"position",
			"hiring",
			"recruitment",
			"career",
			"interview",
			"application",
			"deadline",
			"apply",
			"vacancy",
			"opening",
			"placement",
		];
		const query = `after:${dateStr} (${jobTerms
			.map((term) => `"${term}"`)
			.join(" OR ")})`;
		console.log(`🔍 Searching emails with query: ${query}`);
		const response = await gmail.users.messages.list({
			userId: "me",
			q: query,
			maxResults: parseInt(maxResults),
		});
		const messages = response.data.messages || [];
		console.log(`📧 Found ${messages.length} potential job emails`);
		const jobEmails = [];
		for (let i = 0; i < Math.min(messages.length, parseInt(maxResults)); i++) {
			try {
				const message = await gmail.users.messages.get({
					userId: "me",
					id: messages[i].id,
				});
				const emailData = extractEmailData(message.data);
				if (emailData && isJobRelated(emailData)) {
					console.log(
						`🤖 Classifying: ${emailData.subject.substring(0, 50)}...`
					);
					const classification = await classifyEmail(
						emailData.subject,
						emailData.body
					);
					const processedEmail = {
						...emailData,
						...classification,
						id: messages[i].id,
						processed_at: new Date().toISOString(),
					};
					jobEmails.push(processedEmail);
				}
			} catch (error) {
				console.error(`❌ Error processing email ${i + 1}:`, error.message);
				continue;
			}
		}
		console.log(`✅ Successfully processed ${jobEmails.length} job emails`);
		res.json({
			success: true,
			count: jobEmails.length,
			emails: jobEmails,
			query_info: {
				days_back: parseInt(days),
				max_results: parseInt(maxResults),
				search_query: query,
			},
		});
	} catch (error) {
		console.error("❌ Gmail API error:", error);
		res.status(500).json({
			error: "Failed to fetch emails",
			message: error.message,
		});
	}
});

// Get email details by ID
router.get("/email/:id", async (req, res) => {
	try {
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const gmail = google.gmail({ version: "v1", auth: oauth2Client });
		const message = await gmail.users.messages.get({
			userId: "me",
			id: req.params.id,
		});
		const emailData = extractEmailData(message.data);
		res.json({
			success: true,
			email: emailData,
		});
	} catch (error) {
		console.error("❌ Error fetching email:", error);
		res.status(500).json({
			error: "Failed to fetch email",
			message: error.message,
		});
	}
});

function extractEmailData(message) {
	try {
		const payload = message.payload;
		const headers = payload.headers || [];
		const emailData = {
			subject: "",
			sender: "",
			date: "",
			body: "",
		};
		headers.forEach((header) => {
			const name = header.name.toLowerCase();
			if (name === "subject") emailData.subject = header.value;
			if (name === "from") emailData.sender = header.value;
			if (name === "date") emailData.date = header.value;
		});
		emailData.body = extractEmailBody(payload);
		return emailData;
	} catch (error) {
		console.error("❌ Error extracting email data:", error);
		return null;
	}
}

function extractEmailBody(payload) {
	try {
		let body = "";
		if (payload.body && payload.body.data) {
			body = Buffer.from(payload.body.data, "base64").toString("utf-8");
		} else if (payload.parts) {
			for (const part of payload.parts) {
				if (part.mimeType === "text/plain" && part.body && part.body.data) {
					body += Buffer.from(part.body.data, "base64").toString("utf-8");
				}
			}
		}
		body = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		body = body.substring(0, 5000);
		return body.trim();
	} catch (error) {
		console.error("❌ Error extracting body:", error);
		return "";
	}
}

function isJobRelated(emailData) {
	const content =
		`${emailData.subject} ${emailData.body} ${emailData.sender}`.toLowerCase();
	const jobKeywords = [
		"job",
		"internship",
		"position",
		"opportunity",
		"hiring",
		"recruitment",
		"career",
		"interview",
		"application",
		"apply",
		"vacancy",
		"opening",
		"deadline",
		"resume",
		"placement",
	];
	return jobKeywords.some((keyword) => content.includes(keyword));
}

module.exports = router;
