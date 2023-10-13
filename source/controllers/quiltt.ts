import {Request, Response} from "express";
import axios from "axios";

/**
 * Generates a session token by making a POST request to the Quiltt API.
 *
 * @async
 * @function
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} authToken - Authorization token.
 * @throws Will throw an error if the axios POST request fails.
 * @returns {Promise<string>} The session token.
 */
async function generateToken(): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url: string = "https://api.quiltt.io/v1/users/sessions";
	const data = {};
	const config = {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	};

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("Internal Server Error");
	}
	try {
		const response = await axios.post(url, data, config);
		return response.data.sessionToken;
	} catch (error: any) {
		console.error("Error generating session token:", error.message);
		if (error.response) {
			console.error("Response data:", error.response.data);
			console.error("Response status:", error.response.status);
			throw new Error(
				`Error: ${error.response.status}, ${JSON.stringify(
					error.response.data
				)}`
			);
		} else {
			throw new Error("Internal Server Error");
		}
	}
}

/**
 * Express.js handler function to generate a session token and return it in the HTTP response.
 *
 * @async
 * @function
 * @param {Request} req - Express.js request object.
 * @param {Response} res - Express.js response object.
 * @returns {Promise<void>}
 */
export async function handleGenerateSessionToken(
	req: Request,
	res: Response
): Promise<void> {
	const {email, password} = req.body;

	// Check if the QUILTT_TOKEN environment variable is set

	try {
		const sessionToken: string = await generateToken();
		res.status(200).json({sessionToken});
	} catch (error: any) {
		console.error(error.message);
		const isInternalError = error.message.includes("Internal Server Error");
		res.status(isInternalError ? 500 : 400).json({error: error.message});
	}
}
