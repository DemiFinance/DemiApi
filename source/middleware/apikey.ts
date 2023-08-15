// apiKeyMiddleware.ts
import {Request, Response, NextFunction} from "express";

export const validateApiKey = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		res.status(401).json({error: "No Authorization header provided"});
		return;
	}

	const apiKey = authHeader; // Assuming the API key is directly passed without 'Bearer' prefix

	// Decode the apiKey if it's in Base64 format
	let decodedApiKey;
	try {
		decodedApiKey = Buffer.from(apiKey, "base64").toString("utf-8");
	} catch (err) {
		// If decoding fails, it's probably not Base64, so we'll use the original apiKey
		decodedApiKey = apiKey;
	}

	// Get all environment variables that start with API_KEY_
	const envApiKeys: string[] = [];
	for (const key in process.env) {
		if (key.startsWith("API_KEY_")) {
			envApiKeys.push(process.env[key] as string);
		}
	}

	// Check if provided API key (or its decoded version) is in the list of environment variables
	if (!envApiKeys.includes(apiKey) && !envApiKeys.includes(decodedApiKey)) {
		console.log(
			"Invalid Api Key" +
				JSON.stringify(req.headers) +
				req.originalUrl +
				JSON.stringify(req.body)
		);
		res.status(403).json({error: "Invalid API key"});
		return;
	}

	next();
};
