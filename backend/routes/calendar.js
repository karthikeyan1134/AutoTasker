const express = require("express");
const { google } = require("googleapis");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.use(requireAuth);

// Create calendar events for pending tasks
router.post("/create-reminders", async (req, res) => {
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
		const calendar = google.calendar({ version: "v3", auth: oauth2Client });
		const createdEvents = [];
		const errors = [];
		for (const job of jobs) {
			try {
				if (job.deadline && job.deadline !== "N/A") {
					const deadlineDate = new Date(job.deadline);
					if (deadlineDate > new Date()) {
						const event = {
							summary: `Apply to ${job.company} - ${job.category}`,
							description:
								`Job Application Reminder\n\n` +
								`Company: ${job.company}\n` +
								`Position: ${job.category}\n` +
								`Location: ${job.location}\n` +
								`Salary: ${job.salary}\n` +
								`Tech Stack: ${job.tech_stack}\n` +
								`Application Deadline: ${job.deadline}\n\n` +
								`Don't forget to submit your application!`,
							start: { date: job.deadline },
							end: { date: job.deadline },
							reminders: {
								useDefault: false,
								overrides: [
									{ method: "email", minutes: 24 * 60 },
									{ method: "popup", minutes: 60 },
								],
							},
						};
						const response = await calendar.events.insert({
							calendarId: "primary",
							resource: event,
						});
						createdEvents.push({
							job_id: job.id,
							company: job.company,
							event_id: response.data.id,
							event_link: response.data.htmlLink,
						});
						console.log(`📅 Created calendar event for ${job.company}`);
					}
				}
			} catch (error) {
				console.error(
					`❌ Error creating event for ${job.company}:`,
					error.message
				);
				errors.push({
					job_id: job.id,
					company: job.company,
					error: error.message,
				});
			}
		}
		res.json({
			success: true,
			created_events: createdEvents.length,
			events: createdEvents,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("❌ Calendar error:", error);
		res.status(500).json({
			error: "Failed to create calendar reminders",
			message: error.message,
		});
	}
});

// Get upcoming job-related events
router.get("/events", async (req, res) => {
	try {
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const calendar = google.calendar({ version: "v3", auth: oauth2Client });
		const now = new Date();
		const oneMonthFromNow = new Date();
		oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
		const response = await calendar.events.list({
			calendarId: "primary",
			timeMin: now.toISOString(),
			timeMax: oneMonthFromNow.toISOString(),
			singleEvents: true,
			orderBy: "startTime",
			q: "Apply to",
		});
		const events = response.data.items.map((event) => ({
			id: event.id,
			title: event.summary,
			description: event.description,
			start: event.start.date || event.start.dateTime,
			end: event.end.date || event.end.dateTime,
			link: event.htmlLink,
		}));
		res.json({
			success: true,
			events,
			count: events.length,
		});
	} catch (error) {
		console.error("❌ Error fetching calendar events:", error);
		res.status(500).json({
			error: "Failed to fetch calendar events",
			message: error.message,
		});
	}
});

// Delete calendar event
router.delete("/event/:eventId", async (req, res) => {
	try {
		const { eventId } = req.params;
		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			process.env.GOOGLE_REDIRECT_URI
		);
		oauth2Client.setCredentials(req.session.tokens);
		const calendar = google.calendar({ version: "v3", auth: oauth2Client });
		await calendar.events.delete({
			calendarId: "primary",
			eventId: eventId,
		});
		res.json({
			success: true,
			message: "Calendar event deleted",
		});
	} catch (error) {
		console.error("❌ Error deleting calendar event:", error);
		res.status(500).json({
			error: "Failed to delete calendar event",
			message: error.message,
		});
	}
});

module.exports = router;
