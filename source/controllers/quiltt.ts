import {Request, Response} from "express";
import axios from "axios";
import {
	addQuilttIdToMetadata,
	addQuilttUuidToMetadata,
	getQuilttIdByUserId,
} from "./auth0functions";
import {AccountNumbers, Profile} from "../models/quilttmodels";
import {generateTokenById} from "../utilities/quilttUtil";

/**
 * Generates a new session token for a user.
 *
 * @async
 * @param {string} userId - The user's unique identifier.
 * @returns {Promise<string>} The new session token.
 * @throws Will throw an error if the QUILTT_TOKEN environment variable is not set or blank,
 *         or if there is an error generating the session token.
 */
async function generateToken(userId: string): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url = "https://auth.quiltt.io/v1/users/sessions";

	// Assuming you still want to keep this check
	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("Internal Server Error");
	}

	try {
		console.log("Creating new profile with token");
		const data = {};
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.post(url, data, config);

		addUserIdToMetadata(userId, response.data.userId);

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
			console.log("Quiltt Server Error", error);
			throw new Error("Quiltt Server Error");
		}
	}
}

/**
 * Wraps the addQuilttIdToMetadata function to handle any specific logic for adding user ID to metadata.
 *
 * @param {string} userId - The user ID to be added to metadata.
 * @param {string} quilttId - The Quiltt ID to be associated with the user ID.
 * @returns {Promise<void>} A promise that resolves when the metadata has been updated.
 */
export async function addUserIdToMetadata(
	userId: string,
	quilttId: string
): Promise<void> {
	try {
		// Await the promise returned by addQuilttIdToMetadata
		await addQuilttIdToMetadata(userId, quilttId);
		console.log(`Metadata updated successfully for user ${userId}`);
	} catch (error) {
		console.error(`Error updating metadata for user ${userId}:`, error);
		throw error; // Re-throw the error to be handled by the calling function
	}
}

export async function addUUIDToMetadata(
	userID: string,
	uuid: string
): Promise<void> {
	try {
		// Await the promise returned by addQuilttIdToMetadata
		await addQuilttUuidToMetadata(userID, uuid);
		console.log(`UUID added to metadata for user ${userID}`);
	} catch (error) {
		console.error(`Error adding UUID to metadata for user ${userID}:`, error);
		throw error; // Re-throw the error to be handled by the calling function
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
	try {
		const userId = req.body.userId;
		console.log("Generating session token for User ID:", userId);

		//let sessionToken: string;
		const quilttId = await getQuilttIdByUserId(userId);

		if (quilttId) {
			console.log(`Quiltt ID found: ${quilttId}`);
			const sessionToken: string = await generateTokenById(quilttId);
			console.log(`Generated Session Token ${sessionToken}`);
			res.status(200).json({sessionToken});
		} else {
			console.log("Quiltt ID not found");
			const sessionToken: string = await generateToken(userId);
			console.log(`Generated Session Token ${sessionToken}`);
			res.status(200).json({sessionToken});
		}
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
export async function createQuilttProfile(
	profileData: Profile
): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url = "https://api.quiltt.io/v1/profiles";

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("QUILTT_TOKEN Error");
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
				`createQuilttProfile Error: ${error.response.status}, ${JSON.stringify(
					error.response.data
				)}`
			);
		} else {
			throw new Error("createQuilttProfile Error");
		}
	}
}

/**
 * Fetches the account numbers associated with a given account ID from the Quiltt API.
 *
 * @async
 * @function
 * @param {string} accountId - The ID of the account to fetch the numbers for.
 * @returns {Promise<{accountNumbers: AccountNumbers}>} An object containing the account numbers.
 * @throws Will throw an error if the `QUILTT_TOKEN` environment variable is not set or is blank.
 * @throws Will throw an error if the HTTP request fails, with an error message indicating the status and response data if available, or "Internal Server Error" otherwise.
 */
export async function getAccountNumbers(
	accountId: string
): Promise<{accountNumbers: AccountNumbers}> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url = `https://api.quiltt.io/v1/accounts/${accountId}/ach`;

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("QUILTT_TOKEN Error");
	}

	try {
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.get(url, config);

		console.log("Account nutsack:", response);
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
			throw new Error("GetAccountNumber Error");
		}
	}
}

/**
 * Fetches account information associated with a given account ID from the Quiltt API.
 *
 * @async
 * @function
 * @param {string} accountId - The ID of the account to fetch information for.
 * @returns {Promise<{body: object, profileId: string, type: string}>} An object containing the account information, profile ID, and type.
 * @throws Will throw an error if the `QUILTT_TOKEN` environment variable is not set or is blank.
 * @throws Will throw an error if the HTTP request fails, with an error message indicating the status and response data if available, or "Internal Server Error" otherwise.
 */
export async function fetchAccountInfo(
	accountId: string
): Promise<{body: object; profileId: string; type: string}> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url = `https://api.quiltt.io/v1/remote/mx/accounts/${accountId}`;

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("QUILTT_TOKEN Error");
	}

	try {
		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.get(url, config);
		const body =
			response.data.documents["api.mx.com"][
				"/users/{user_guid}/accounts/{account_guid}"
			].body;
		const profileId = response.data.profileId;
		const type = response.data.type; // Extracting the 'type' parameter
		return {body, profileId, type}; // Returning 'type' along with 'body' and 'profileId'
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
			throw new Error("FetchAccountInfo Error");
		}
	}
}
