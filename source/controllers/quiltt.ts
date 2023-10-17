import {Request, Response} from "express";
import axios from "axios";
import {getPhoneNumberById} from "./auth0functions";
import {AccountNumbers, Profile} from "../models/quilttmodels";

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
async function generateToken(userId: string): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url: string = "https://api.quiltt.io/v1/users/sessions";

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("Internal Server Error");
	}

	try {
		const phoneNumber: string = await getPhoneNumberById(userId);

		const data = {
			phoneNumber: phoneNumber,
		};

		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.post(url, data, config);
		addUserIdToMetadata(response.data.userId);
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

export async function addUserIdToMetadata(userId: string) {
	console.log(userId);
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
	try {

		//check auth0 data for quilttUserId
		//if present then request a session token for that user, if nnot present create a new quilttProfile based on the exisiting auth0User


		const userId = req.body.userId;

		const sessionToken: string = await generateToken(userId);
		res.status(200).json({sessionToken});
	} catch (error: any) {
		console.error(error.message);
		const isInternalError = error.message.includes("Internal Server Error");
		res.status(isInternalError ? 500 : 400).json({error: error.message});
	}
}

/**
 * Creates a new profile on the Quiltt platform.
 *
 * @async
 * @function createProfile
 * @param {Profile} profileData - The data for the new profile.
 * @returns {Promise<string>} The id of the created profile.
 * @throws Will throw an error if the QUILTT_TOKEN environment variable is not set or is blank.
 * @throws Will throw an error if the HTTP request fails.
 */
export async function createQuilttProfile(profileData: Profile): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url: string = "https://api.quiltt.io/v1/profiles";

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("Internal Server Error");
	}

	try {
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.post(url, profileData, config);
		const createdProfile: Profile = response.data;
		return createdProfile.id;
	} catch (error: any) {
		console.error("Error creating profile:", error.message);
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

export async function getAccountNumbers(
	accountId: string
): Promise<{accountNumbers: AccountNumbers}> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url: string = `https://api.quiltt.io/v1/accounts/${accountId}/ach`;

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("Internal Server Error");
	}

	try {
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.get(url, config);
		return {accountNumbers: response.data};
	} catch (error: any) {
		console.error("Error fetching account:", error.message);
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
