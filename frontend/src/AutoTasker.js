import React, { useState, useEffect } from "react";
import {
	Mail,
	Calendar,
	FileSpreadsheet,
	User,
	RefreshCw,
	Settings,
	LogOut,
	Plus,
	Clock,
	Building,
	MapPin,
	DollarSign,
	Code,
	CheckCircle,
	XCircle,
	AlertCircle,
	ExternalLink,
	Filter,
	Search,
	Loader2,
} from "lucide-react";

const AutoTasker = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("dashboard");
	const [jobs, setJobs] = useState([]);
	const [events, setEvents] = useState([]);
	const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
	const [syncing, setSyncing] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [dashboardStats, setDashboardStats] = useState({
		total_jobs: 0,
		pending_applications: 0,
		completed_applications: 0,
		upcoming_deadlines: 0,
	});

	const API_BASE =
		process.env.NODE_ENV === "production"
			? "https://your-backend-url.com"
			: "http://localhost:5000";

	// Check authentication status on mount
	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		try {
			const response = await fetch(`${API_BASE}/auth/status`, {
				credentials: "include",
			});
			const data = await response.json();

			if (data.authenticated) {
				setUser(data.user);
				await initializeUserData();
			}
		} catch (error) {
			console.error("Auth check failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const initializeUserData = async () => {
		try {
			// Initialize spreadsheet
			const sheetsResponse = await fetch(`${API_BASE}/api/sheets/init`, {
				credentials: "include",
			});
			const sheetsData = await sheetsResponse.json();
			if (sheetsData.success) {
				setSpreadsheetUrl(sheetsData.url);
			}

			// Load existing jobs
			await loadJobs();

			// Load calendar events
			await loadCalendarEvents();
		} catch (error) {
			console.error("Initialization failed:", error);
		}
	};

	const loadJobs = async () => {
		try {
			const response = await fetch(`${API_BASE}/api/sheets/jobs`, {
				credentials: "include",
			});
			const data = await response.json();
			if (data.success) {
				setJobs(data.jobs);
				updateDashboardStats(data.jobs);
			}
		} catch (error) {
			console.error("Failed to load jobs:", error);
		}
	};

	const loadCalendarEvents = async () => {
		try {
			const response = await fetch(`${API_BASE}/api/calendar/events`, {
				credentials: "include",
			});
			const data = await response.json();
			if (data.success) {
				setEvents(data.events);
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	};

	const updateDashboardStats = (jobsList) => {
		const stats = {
			total_jobs: jobsList.length,
			pending_applications: jobsList.filter((job) => job.status === "Pending")
				.length,
			completed_applications: jobsList.filter((job) => job.status === "Applied")
				.length,
			upcoming_deadlines: jobsList.filter((job) => {
				if (job.deadline === "N/A") return false;
				const deadline = new Date(job.deadline);
				const today = new Date();
				const daysDiff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
				return daysDiff <= 7 && daysDiff > 0;
			}).length,
		};
		setDashboardStats(stats);
	};

	const handleGoogleLogin = () => {
		window.location.href = `${API_BASE}/auth/google`;
	};

	const handleLogout = async () => {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
			setUser(null);
			setJobs([]);
			setEvents([]);
			setSpreadsheetUrl("");
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	const handleSync = async (days = 7) => {
		setSyncing(true);
		try {
			const response = await fetch(`${API_BASE}/api/tasks/sync`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ days }),
			});

			const data = await response.json();
			if (data.success) {
				await loadJobs();
				await loadCalendarEvents();
				alert(
					`Sync complete! Found ${
						data.summary?.fetched_emails || 0
					} new job emails.`
				);
			}
		} catch (error) {
			console.error("Sync failed:", error);
			alert("Sync failed. Please try again.");
		} finally {
			setSyncing(false);
		}
	};

	const updateJobStatus = async (jobId, newStatus) => {
		try {
			const response = await fetch(`${API_BASE}/api/sheets/job/${jobId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				await loadJobs();
			}
		} catch (error) {
			console.error("Failed to update job status:", error);
		}
	};

	const filteredJobs = jobs.filter((job) => {
		const matchesSearch =
			job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
			job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			job.location.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === "All" || job.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading AutoTasker...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
					<div className="mb-8">
						<div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Mail className="w-10 h-10 text-indigo-600" />
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							AutoTasker
						</h1>
						<p className="text-gray-600">
							Automatically detect job opportunities from your emails and manage
							applications
						</p>
					</div>

					<button
						onClick={handleGoogleLogin}
						className="w-full bg-white border-2 border-gray-200 rounded-lg px-6 py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors font-medium text-gray-700">
						<svg className="w-5 h-5" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</button>

					<div className="mt-6 text-sm text-gray-500">
						<p>✅ Gmail access for job email detection</p>
						<p>✅ Google Sheets for task management</p>
						<p>✅ Google Calendar for reminders</p>
					</div>
				</div>
			</div>
		);
	}

	const StatCard = ({ icon: Icon, label, value, color = "indigo" }) => (
		<div className="bg-white rounded-lg shadow-sm p-6 border">
			<div className="flex items-center">
				<div className={`p-3 rounded-lg bg-${color}-100`}>
					<Icon className={`w-6 h-6 text-${color}-600`} />
				</div>
				<div className="ml-4">
					<p className="text-sm font-medium text-gray-600">{label}</p>
					<p className="text-2xl font-bold text-gray-900">{value}</p>
				</div>
			</div>
		</div>
	);

	const JobCard = ({ job }) => (
		<div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start mb-4">
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Building className="w-5 h-5 text-gray-600" />
						{job.company}
					</h3>
					<p className="text-indigo-600 font-medium">{job.category}</p>
				</div>
				<div className="flex gap-2">
					<select
						value={job.status}
						onChange={(e) => updateJobStatus(job.id, e.target.value)}
						className="text-sm border rounded px-2 py-1">
						<option value="Pending">Pending</option>
						<option value="Applied">Applied</option>
						<option value="Rejected">Rejected</option>
						<option value="Interview">Interview</option>
					</select>
				</div>
			</div>

			<div className="space-y-2 text-sm text-gray-600">
				<div className="flex items-center gap-2">
					<MapPin className="w-4 h-4" />
					<span>{job.location}</span>
				</div>
				<div className="flex items-center gap-2">
					<DollarSign className="w-4 h-4" />
					<span>{job.salary}</span>
				</div>
				<div className="flex items-center gap-2">
					<Clock className="w-4 h-4" />
					<span>Deadline: {job.deadline}</span>
				</div>
				<div className="flex items-center gap-2">
					<Code className="w-4 h-4" />
					<span>{job.tech_stack}</span>
				</div>
			</div>
		</div>
	);

	const EventCard = ({ event }) => (
		<div className="bg-white rounded-lg shadow-sm border p-4">
			<h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
			<p className="text-sm text-gray-600 mb-2">
				{new Date(event.start).toLocaleDateString()}
			</p>
			<a
				href={event.link}
				target="_blank"
				rel="noopener noreferrer"
				className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1">
				Open in Calendar <ExternalLink className="w-3 h-3" />
			</a>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center gap-3">
							<Mail className="w-8 h-8 text-indigo-600" />
							<h1 className="text-xl font-bold text-gray-900">AutoTasker</h1>
						</div>

						<div className="flex items-center gap-4">
							<button
								onClick={() => handleSync()}
								disabled={syncing}
								className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
								{syncing ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<RefreshCw className="w-4 h-4" />
								)}
								Sync Jobs
							</button>

							<div className="flex items-center gap-3">
								<img
									src={user.picture}
									alt={user.name}
									className="w-8 h-8 rounded-full"
								/>
								<span className="text-sm font-medium text-gray-700">
									{user.name}
								</span>
								<button
									onClick={handleLogout}
									className="p-2 text-gray-400 hover:text-gray-600">
									<LogOut className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation Tabs */}
				<div className="mb-8">
					<nav className="flex space-x-8">
						{[
							{ id: "dashboard", label: "Dashboard", icon: User },
							{ id: "jobs", label: "Job Opportunities", icon: Building },
							{ id: "calendar", label: "Calendar Events", icon: Calendar },
						].map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								onClick={() => setActiveTab(id)}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
									activeTab === id
										? "bg-indigo-100 text-indigo-700"
										: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
								}`}>
								<Icon className="w-5 h-5" />
								{label}
							</button>
						))}
					</nav>
				</div>

				{/* Dashboard Tab */}
				{activeTab === "dashboard" && (
					<div className="space-y-8">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<StatCard
								icon={Building}
								label="Total Jobs Found"
								value={dashboardStats.total_jobs}
								color="blue"
							/>
							<StatCard
								icon={Clock}
								label="Pending Applications"
								value={dashboardStats.pending_applications}
								color="yellow"
							/>
							<StatCard
								icon={CheckCircle}
								label="Completed Applications"
								value={dashboardStats.completed_applications}
								color="green"
							/>
							<StatCard
								icon={AlertCircle}
								label="Upcoming Deadlines"
								value={dashboardStats.upcoming_deadlines}
								color="red"
							/>
						</div>

						{spreadsheetUrl && (
							<div className="bg-white rounded-lg shadow-sm border p-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											Your Job Tracking Spreadsheet
										</h3>
										<p className="text-gray-600">
											View and manage all your job opportunities in Google
											Sheets
										</p>
									</div>
									<a
										href={spreadsheetUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
										<FileSpreadsheet className="w-4 h-4" />
										Open Spreadsheet
									</a>
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Recent Jobs
								</h3>
								<div className="space-y-4">
									{jobs.slice(0, 5).map((job, index) => (
										<JobCard key={index} job={job} />
									))}
									{jobs.length === 0 && (
										<p className="text-gray-500 text-center py-8">
											No jobs found. Click "Sync Jobs" to scan your emails.
										</p>
									)}
								</div>
							</div>

							<div>
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Upcoming Events
								</h3>
								<div className="space-y-4">
									{events.slice(0, 5).map((event, index) => (
										<EventCard key={index} event={event} />
									))}
									{events.length === 0 && (
										<p className="text-gray-500 text-center py-8">
											No upcoming events. Sync jobs with deadlines to create
											reminders.
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Jobs Tab */}
				{activeTab === "jobs" && (
					<div className="space-y-6">
						<div className="flex flex-col sm:flex-row gap-4 justify-between">
							<div className="flex gap-4">
								<div className="relative">
									<Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
									<input
										type="text"
										placeholder="Search jobs..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 pr-4 py-2 border rounded-lg w-64"
									/>
								</div>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="px-4 py-2 border rounded-lg">
									<option value="All">All Status</option>
									<option value="Pending">Pending</option>
									<option value="Applied">Applied</option>
									<option value="Rejected">Rejected</option>
									<option value="Interview">Interview</option>
								</select>
							</div>
							<p className="text-sm text-gray-600">
								{filteredJobs.length} of {jobs.length} jobs
							</p>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
							{filteredJobs.map((job, index) => (
								<JobCard key={index} job={job} />
							))}
						</div>

						{filteredJobs.length === 0 && (
							<div className="text-center py-12">
								<Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-500">
									{jobs.length === 0
										? "No jobs found. Click 'Sync Jobs' to scan your emails."
										: "No jobs match your current filters."}
								</p>
							</div>
						)}
					</div>
				)}

				{/* Calendar Tab */}
				{activeTab === "calendar" && (
					<div className="space-y-6">
						<div className="flex justify-between items-center">
							<h2 className="text-2xl font-bold text-gray-900">
								Calendar Events
							</h2>
							<p className="text-sm text-gray-600">
								{events.length} upcoming events
							</p>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
							{events.map((event, index) => (
								<EventCard key={index} event={event} />
							))}
						</div>

						{events.length === 0 && (
							<div className="text-center py-12">
								<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-500">
									No upcoming events. Job deadlines will automatically create
									calendar reminders.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default AutoTasker;
