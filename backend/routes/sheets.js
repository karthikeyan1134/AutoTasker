const express = require("express");
const { google } = require("googleapis");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.use(requireAuth);

const SPREADSHEET_TITLE = "AutoTasker - Job Opportunities";
const HEADERS = [
	"Company",
	"Location",
	"Salary",
	"Deadline",
	"Category",
	"Tech Stack",
	"Subject",
	"Sender",
	"Date Added",
	"Status",
];

// Get or create user's spreadsheet
router.get("/init", async (req, res) => {
	try {
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const sheets = google.sheets({ version: "v4", auth: oauth2Client });
		const drive = google.drive({ version: "v3", auth: oauth2Client });
		let spreadsheetId = req.session.spreadsheetId;
		if (!spreadsheetId) {
			const searchResponse = await drive.files.list({
				q: `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet'`,
				spaces: "drive",
			});
			if (searchResponse.data.files.length > 0) {
				spreadsheetId = searchResponse.data.files[0].id;
			} else {
				const createResponse = await sheets.spreadsheets.create({
					resource: {
						properties: { title: SPREADSHEET_TITLE },
						sheets: [{ properties: { title: "Job Opportunities" } }],
					},
				});
				spreadsheetId = createResponse.data.spreadsheetId;
				await sheets.spreadsheets.values.update({
					spreadsheetId,
					range: "A1:J1",
					valueInputOption: "RAW",
					resource: { values: [HEADERS] },
				});
				console.log(`📊 Created new spreadsheet: ${spreadsheetId}`);
			}
			req.session.spreadsheetId = spreadsheetId;
		}
		res.json({
			success: true,
			spreadsheetId,
			url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
		});
	} catch (error) {
		console.error("❌ Sheets init error:", error);
		res.status(500).json({
			error: "Failed to initialize spreadsheet",
			message: error.message,
		});
	}
});

// Add job data to spreadsheet
router.post("/add-jobs", async (req, res) => {
	try {
		const { jobs } = req.body;
		if (!jobs || !Array.isArray(jobs)) {
			return res.status(400).json({ error: "Jobs array is required" });
		}
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const sheets = google.sheets({ version: "v4", auth: oauth2Client });
		const spreadsheetId = req.session.spreadsheetId;
		if (!spreadsheetId) {
			return res.status(400).json({ error: "Spreadsheet not initialized" });
		}
		const values = jobs.map((job) => [
			job.company || "Unknown",
			job.location || "Unknown",
			job.salary || "Not specified",
			job.deadline || "N/A",
			job.category || "Not specified",
			job.tech_stack || "Not specified",
			job.subject || "",
			job.sender || "",
			new Date().toISOString().split("T")[0],
			"Pending",
		]);
		const response = await sheets.spreadsheets.values.append({
			spreadsheetId,
			range: "A:J",
			valueInputOption: "RAW",
			insertDataOption: "INSERT_ROWS",
			resource: { values },
		});
		console.log(`📊 Added ${values.length} jobs to spreadsheet`);
		res.json({
			success: true,
			added_count: values.length,
			updated_range: response.data.updates.updatedRange,
		});
	} catch (error) {
		console.error("❌ Error adding jobs to spreadsheet:", error);
		res.status(500).json({
			error: "Failed to add jobs to spreadsheet",
			message: error.message,
		});
	}
});

// Get all jobs from spreadsheet
router.get("/jobs", async (req, res) => {
	try {
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const sheets = google.sheets({ version: "v4", auth: oauth2Client });
		const spreadsheetId = req.session.spreadsheetId;
		if (!spreadsheetId) {
			return res.status(400).json({ error: "Spreadsheet not initialized" });
		}
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: "A:J",
		});
		const rows = response.data.values || [];
		if (rows.length <= 1) {
			return res.json({ success: true, jobs: [] });
		}
		const jobs = rows.slice(1).map((row, index) => ({
			id: index + 2,
			company: row[0] || "Unknown",
			location: row[1] || "Unknown",
			salary: row[2] || "Not specified",
			deadline: row[3] || "N/A",
			category: row[4] || "Not specified",
			tech_stack: row[5] || "Not specified",
			subject: row[6] || "",
			sender: row[7] || "",
			date_added: row[8] || "",
			status: row[9] || "Pending",
		}));
		res.json({
			success: true,
			jobs,
			count: jobs.length,
		});
	} catch (error) {
		console.error("❌ Error fetching jobs from spreadsheet:", error);
		res.status(500).json({
			error: "Failed to fetch jobs",
			message: error.message,
		});
	}
});

// Update job status
router.patch("/job/:rowId", async (req, res) => {
	try {
		const { rowId } = req.params;
		const { status } = req.body;
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const sheets = google.sheets({ version: "v4", auth: oauth2Client });
		const spreadsheetId = req.session.spreadsheetId;
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `J${rowId}`,
			valueInputOption: "RAW",
			resource: { values: [[status]] },
		});
		res.json({
			success: true,
			message: "Job status updated",
		});
	} catch (error) {
		console.error("❌ Error updating job status:", error);
		res.status(500).json({
			error: "Failed to update job status",
			message: error.message,
		});
	}
});

module.exports = router;
