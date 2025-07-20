// server.js - Main server file
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const gmailRoutes = require("./routes/gmail");
const sheetsRoutes = require("./routes/sheets");
const calendarRoutes = require("./routes/calendar");
const tasksRoutes = require("./routes/tasks");

const app = express();

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
	session({
		secret: process.env.SESSION_SECRET || "your-secret-key",
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl:
				process.env.MONGODB_URI || "mongodb://localhost:27017/autotasker",
		}),
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	})
);

// Routes
app.use("/auth", authRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/sheets", sheetsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/tasks", tasksRoutes);

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Something went wrong!",
		message:
			process.env.NODE_ENV === "development"
				? err.message
				: "Internal server error",
	});
});

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📧 AutoTasker Backend Ready!`);
});

module.exports = app;
