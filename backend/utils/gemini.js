const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const classifyEmail = async (subject, body) => {
	try {
		const prompt = `
You are an expert email classifier for job opportunities. Analyze the following email content and extract job-related information.
Return ONLY a valid JSON object with this exact structure:
{
  "company": "exact company name or 'Unknown'",
  "location": "city/state/country or 'Remote' or 'Unknown'",
  "salary": "salary/stipend with currency or 'Not specified'",
  "deadline": "application deadline in MM/DD/YYYY format or 'N/A'",
  "category": "specific job role/position or 'Not specified'",
  "tech_stack": "comma-separated technologies or 'Not specified'"
}
Email Content:
Subject: ${subject}
Body:
${body}
    `;
		const response = await model.generate({
			prompt,
			temperature: 0.2,
			maxOutputTokens: 512,
		});
		const text = response.text.trim();
		return JSON.parse(text);
	} catch (err) {
		console.error("❌ Gemini classification error:", err);
		return {
			company: "Unknown",
			location: "Unknown",
			salary: "Not specified",
			deadline: "N/A",
			category: "Not specified",
			tech_stack: "Not specified",
		};
	}
};

module.exports = { classifyEmail };
