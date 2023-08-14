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

	const apiKey = authHeader; //.split(" ")[1]; // Assuming 'Bearer YOUR_API_KEY' format

	// Get all environment variables that start with API_KEY_
	const envApiKeys: string[] = [];
	for (const key in process.env) {
		if (key.startsWith("API_KEY_")) {
			envApiKeys.push(process.env[key] as string);
		}
	}

	// Check if provided API key is in the list of environment variables
	if (!envApiKeys.includes(apiKey)) {
		console.log("Invalid Api Key");
		res.status(403).json({error: "Invalid API key"});
		return;
	}

	next();
};
