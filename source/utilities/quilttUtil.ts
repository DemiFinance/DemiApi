import axios from "axios";
import {Quiltt_Token_EnvVar_Error} from "./errors/demierrors";
import logger from "../wrappers/winstonLogging";
import {log} from "console";
import tracer from "../wrappers/datadogTracer";

/**
 * Checks the validity of a session token by sending a GET request to the session validation endpoint.
 *
 * @param {string} sessionToken - The session token to validate.
 * @return {Promise<boolean>} True if the session is valid, or false if the session is invalid.
 * @throws Will throw an error if there's a network error.
 */
export async function checkSessionToken(
	sessionToken: string
): Promise<boolean> {
	try {
		const response = await axios.get(
			"https://auth.quiltt.io/v1/users/session",
			{
				headers: {
					Authorization: `Bearer ${sessionToken}`,
				},
			}
		);

		return response.status === 200;
	} catch (error: unknown) {
		// Type guard to check if error is an AxiosError
		if (
			axios.isAxiosError(error) &&
			error.response &&
			error.response.status === 401
		) {
			console.log("Session token is invalid");
			return false; // Session token is invalid
		}
		throw new Error(`Check Session Token Error: ${error}`); // Re-throw error if it's not a 401 or other network-related error
	}
}

/**
 * Refreshes the session token by sending a POST request to the session refresh endpoint.
 *
 * @return {Promise<string>} The new session token.
 * @throws Will throw an error if unable to refresh the session token.
 */
export async function refreshSessionToken(quilttId: string): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;

	if (!authToken) {
		throw new Quiltt_Token_EnvVar_Error(
			"Environment Variable Error: QUILTT_TOKEN"
		);
	}

	try {
		const data = {userId: quilttId};
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.post(
			"https://auth.quiltt.io/v1/users/sessions",
			data,
			config
		);

		return response.data.token;
	} catch (error) {
		throw new Error("Unable to refresh session token");
	}
}

/**
 * Generates a session token using a user's ID.
 *
 * @async
 * @function
 * @param {string} userId - The ID of the user to generate a session token for.
 * @returns {Promise<string>} - A Promise that resolves to a session token string.
 * @throws Will throw an error if the `QUILTT_TOKEN` environment variable is not set or is blank.
 * @throws Will throw an error if the HTTP request fails, with an error message indicating the status and response data if available, or "Internal Server Error" otherwise.
 */
export async function generateTokenById(userId: string): Promise<string> {
	const span = tracer.startSpan("generateTokenById");
	span.setTag("user.id", userId);

	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url = "https://auth.quiltt.io/v1/users/sessions";

	if (!authToken) {
		logger.log(
			"error",
			"QUILTT_TOKEN environment variable is not set or is blank"
		);
		span.setTag("error", true);
		span.log({
			event: "error",
			message: "QUILTT_TOKEN environment variable is not set or is blank",
		});
		span.finish();
		throw new Quiltt_Token_EnvVar_Error("QUILTT_TOKEN Error");
	}

	try {
		logger.log("info", "Creating token for existing profile");
		const data = {userId: userId};
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.post(url, data, config);
		span.finish(); // Finish the span successfully as the token was generated
		return response.data.token;
	} catch (error: any) {
		span.setTag("error", true);
		span.log({
			event: "error",
			message: error.message,
			"error.object": error,
			stack: error.stack,
			"http.status_code": error.response?.status,
			"http.response.body": error.response?.data,
		});
		logger.log("error", "Error generating session token by ID:", error.message);
		if (error.response) {
			logger.log("error", "Response data:", error.response.data);
			logger.log("error", "Response status:", error.response.status);
		}
		span.finish(); // Finish the span with error information
		throw new Error("GenerateTokenByID Error");
	}
}
