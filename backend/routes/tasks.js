const express = require("express");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
const axios = require("axios");

router.use(requireAuth);

// Get dashboard summary
router.get("/dashboard", async (req, res) => {
	try {
		res.json({
			success: true,
			summary: {
				total_jobs: 0,
				pending_applications: 0,
				completed_applications: 0,
				upcoming_deadlines: 0,
			},
			recent_jobs: [],
			upcoming_deadlines: [],
		});
	} catch (error) {
		console.error("❌ Error fetching dashboard data:", error);
		res.status(500).json({
			error: "Failed to fetch dashboard data",
			message: error.message,
		});
	}
});

// Full sync endpoint
router.post("/sync", async (req, res) => {
	try {
		const { days = 7 } = req.body;
		const gmailRes = await axios.get(
			`${process.env.BACKEND_URL}/api/gmail/jobs`,
			{
				params: { days, maxResults: 50 },
				withCredentials: true,
			}
		);
		const emails = gmailRes.data.emails || [];
		if (emails.length === 0) {
			return res.json({ success: true, message: "No job emails found." });
		}
		const sheetsRes = await axios.post(
			`${process.env.BACKEND_URL}/api/sheets/add-jobs`,
			{
				jobs: emails,
			},
			{ withCredentials: true }
		);
		const pendingJobs = emails
			.filter((job) => job.deadline && job.deadline !== "N/A")
			.map((job) => ({
				id: job.id,
				company: job.company,
				category: job.category,
				location: job.location,
				salary: job.salary,
				tech_stack: job.tech_stack,
				deadline: job.deadline,
			}));
		const calendarRes = await axios.post(
			`${process.env.BACKEND_URL}/api/calendar/create-reminders`,
			{
				jobs: pendingJobs,
			},
			{ withCredentials: true }
		);
		res.json({
			success: true,
			message: "Sync complete",
			summary: {
				fetched_emails: emails.length,
				added_to_sheet: sheetsRes.data.added_count,
				calendar_events_created: calendarRes.data.created_events,
			},
		});
	} catch (error) {
		console.error("❌ Sync error:", error);
		res.status(500).json({
			error: "Sync failed",
			message: error.message,
		});
	}
});

module.exports = router;
