const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
	{
		googleId: { type: String, required: true, unique: true },
		email: { type: String, required: true },
		name: String,
		picture: String,
		tokens: {
			access_token: String,
			refresh_token: String,
			scope: String,
			token_type: String,
			expiry_date: Number,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("UserToken", TokenSchema);
