import {Request, Response} from "express";
import {
	Auth0_GetUserById_Error,
	Auth0_Metadata_Search_Error,
	Auth0_No_User_Found_Error,
	Auth0_Search_User_Error,
	Phone_Number_Bad_Format,
	Phone_Number_Not_Found,
	UserID_Not_a_string,
} from "../utilities/errors/demierrors";
import {AppMetadata, LuceneQuery, User} from "../models/auth0";
import {auth0Api} from "../utilities/axiosHelper";
import logger from "../wrappers/winstonLogging";
import tracer from "../wrappers/datadogTracer";

export const searchUsers = async (query: LuceneQuery) => {
	try {
		logger.log("info", `[Search Users] Query: ${query}`);
		const response = await auth0Api.get("users", {
			params: {q: query, search_engine: "v3"},
		});

		// Parse the JSON and cast to the User array
		const users: User[] = response.data;

		return users; // The response is an array of User objects
	} catch (error) {
		logger.log("error", `[Search Users] Error: ${error}`);
		throw new Auth0_Search_User_Error("Failed to search users");
	}
};

export const getUserById = async (userId: string): Promise<User> => {
	try {
		const response = await auth0Api.get(`users/${userId}`);
		const user: User = response.data;
		return user;
	} catch (error) {
		throw new Auth0_GetUserById_Error("Failed to get user by id");
	}
};

export const fetchDaysInAdvanceByUserId = async (userId: string) => {
	try {
		const user = await getUserById(userId);
		return user?.app_metadata.daysInAdvance || null;
	} catch (error) {
		return null;
	}
};

export const getEntityIdByQuilttAccount = async (quilttUuid: string) => {
	const query = `app_metadata.quiltt_uuid:"${quilttUuid}"`;
	try {
		const users = await searchUsers(query);
		const user = users[0]; // Consider adding more robust user selection logic
		if (!user)
			throw new Error(`No matching entity found with uuid ${quilttUuid}`);
		return user.app_metadata.entity_id;
	} catch (error) {
		// Handle or throw the error as needed
	}
};

export const updateUserMetadata = async (
	userId: string,
	metadata: Partial<AppMetadata>
) => {
	const endpoint = `users/${userId}`;
	try {
		await auth0Api.patch(endpoint, {app_metadata: metadata});
		logger.log(
			"info",
			"[Update User Metadata] User metadata updated successfully"
		);
	} catch (error) {
		logger.log("error", `[Update User Metadata] Error: ${error}`);
		throw error; // Re-throw the error to be handled by the calling function
	}
};

/**
 * Update a user's metadata in Auth0.
 *
 * @param accessToken The Auth0 Management API access token.
 * @param userId The ID of the user to update.
 * @param metadata The metadata to set for the user.
 * @returns The updated user object.
 */
export async function updateUserMeta(
	userId: string,
	givenName: string,
	familyName: string,
	metadata: {[key: string]: any}
): Promise<any> {
	const endpoint = `users/${userId}`;
	try {
		const response = await auth0Api.patch(endpoint, {
			name: `${givenName} ${familyName}`,
			given_name: givenName,
			family_name: familyName,
			app_metadata: metadata,
		});

		// Return the response data
		return response.data;
	} catch (error) {
		logger.log(
			"error",
			`Error updating user metadata for user with ID ${userId}: ${error}`
		);
		throw new Error("Failed to update user metadata");
	}
}

/**
 * Fetches the number of days in advance a user has selected for their notification based on the entity ID.
 *
 * @async
 * @function fetchDaysInAdvanceByEntityId
 * @param {string} entityId - The entity ID associated with the user.
 * @returns {Promise<number|null>} The number of days in advance or null if there's an error or if the data is not available.
 * @throws {Error} Throws an error if there's a failure in fetching the data.
 */
export const fetchDaysInAdvanceByEntityId = async (entityId: string) => {
	const query = `app_metadata.entity_id:"${entityId}"`;
	try {
		const users = await searchUsers(query);
		const user = users[0]; // Consider adding more robust user selection logic
		if (!user)
			throw new Error(`No matching entity found with entityId ${entityId}`);
		return user.app_metadata.daysInAdvance;
	} catch (error) {
		// Handle or throw the error as needed
	}
};

/**
 * Express route handler to get the number of days in advance for a user based on the entity ID.
 *
 * @async
 * @function getDaysInAdvanceByEntityId
 * @param {Request} request - The Express request object.
 * @param {Response} response - The Express response object.
 * @returns {Response} Returns a response with the number of days in advance or an error message.
 */
export const getDaysInAdvanceByEntityId = async (
	request: Request,
	response: Response
) => {
	try {
		const entityId: string = request.params.id;
		const daysInAdvance = await fetchDaysInAdvanceByEntityId(entityId);
		return response.status(200).json({daysInAdvance});
	} catch (error) {
		logger.log("error", `[Get Days In Advance By Entity ID] Error: ${error}`);
		return response.status(500).json({error: "Internal server error"});
	}
};

/**
 * Updates a user's metadata in the Auth0 Management API to include a Quiltt account ID.
 *
 * @param {string} entityId - The ID of the entity (user) whose metadata should be updated.
 * @param {string} quilttId - The Quiltt account ID to add to the user's metadata.
 * @returns {Promise<void>} A promise that resolves when the metadata has been successfully updated.
 * @throws Will throw an error if the request to update the metadata fails.
 * @async
 */
export const addQuilttIdToMetadata = async (
	entityId: string,
	quilttId: string
): Promise<void> => {
	const metadata: Partial<AppMetadata> = {
		quiltt_account_id: quilttId,
	};

	try {
		updateUserMetadata(entityId, metadata);
	} catch (error) {
		logger.log("error", `[Add Quiltt ID to Metadata] Error: ${error}`);
		throw error; // Re-throw the error to be handled by the calling function
	}
};

/**
 * Updates a user's metadata in the Auth0 Management API to include a Quiltt  UUID.
 *
 * @param {string} auth0Id - The ID of the entity (user) whose metadata should be updated.
 * @param {string} uuid - The Quiltt account ID to add to the user's metadata.
 * @returns {Promise<void>} A promise that resolves when the metadata has been successfully updated.
 * @throws Will throw an error if the request to update the metadata fails.
 * @async
 */
export const addQuilttUuidToMetadata = async (
	auth0Id: string,
	uuid: string
): Promise<void> => {
	const metadata: Partial<AppMetadata> = {
		quiltt_uuid: uuid,
	};

	try {
		updateUserMetadata(auth0Id, metadata);
	} catch (error) {
		logger.log("error", `[Add Quiltt UUID to Metadata] Error: ${error}`);
		throw error; // Re-throw the error to be handled by the calling function
	}
};

export const getQuilttIdByUserId = async (
	userId: string
): Promise<string | null> => {
	try {
		const user: User = await getUserById(userId);
		logger.log("info", `[getQuilttIdByUserId] User:${user}`);

		// Assuming the data object is the relevant user
		return user?.app_metadata.quiltt_account_id || null;
	} catch (error) {
		logger.log("error", `[getQuilttIdByUserId] Error:${error}`);
		return null;
	}
};

export const getEntityIdByUserId = async (
	userId: string
): Promise<string | null> => {
	try {
		const user: User = await getUserById(userId);
		logger.log("info", `[getEntityIdByUserId] User:${user}`);

		// Assuming the data object is the relevant user
		return user?.app_metadata.entity_id || null;
	} catch (error) {
		logger.log("error", `[getEntityIdByUserId] Error:${error}`);
		return null;
	}
};

/**
 * Retrieves the entity ID associated with a given Quiltt account ID by querying the Auth0 Management API.
 *
 * @param {string} quilttAccountId - The Quiltt account ID used to search the user's metadata.
 * @returns {Promise<string>} A promise that resolves to the entity ID if found, or rejects with an error if not found or if the request fails.
 * @throws Will throw an Auth0_Metadata_Search_Error if no user is found or if unable to make the API request.
 * @async
 */
export const getAuth0IdByQuilttId = async (
	quilttAccountId: string
): Promise<string> => {
	// Start a new Datadog span for this operation
	const span = tracer.startSpan("getAuth0IdByQuilttId");
	span.setTag("quiltt.account_id", quilttAccountId);
	const query = `app_metadata.quiltt_account_id:"${quilttAccountId}"`;
	try {
		logger.log("info", `[getAuth0IdByQuilttId] ${quilttAccountId}`);
		const user: User[] = await searchUsers(query);
		if (!user || user.length === 0) {
			throw new Auth0_No_User_Found_Error(
				`No matching entity found with Quiltt Account ID ${quilttAccountId}`
			);
		}
		logger.log("info", `[getAuth0IdByQuilttId] User: ${user}`);

		if (typeof user[0].user_id !== "string") {
			throw new UserID_Not_a_string("User ID must be a string");
		}

		span.finish(); // Finish the span successfully
		return user[0].user_id;
	} catch (error) {
		logger.log("error", `[getAuth0IdByQuilttId] Error: ${error}`);
		span.setTag("error", true);
		span.log({
			event: "error",
			"error.kind": (error as Error).constructor.name,
			message: (error as Error).message,
			stack: (error as Error).stack,
		});
		span.finish(); // Finish the span with error information
		throw new Auth0_Metadata_Search_Error((error as Error).message);
	}
};

/**
 * Fetches the phone number of a user by their user ID from the Auth0 Management API.
 *
 * @async
 * @function
 * @param {string} userId - The user ID of the user.
 * @returns {Promise<string>} A Promise that resolves to the phone number if found.
 * @throws Will throw an error if unable to retrieve the token or make the API request, or if no number is found.
 */
export const getUserPhoneNumber = async (userId: string): Promise<string> => {
	try {
		const user = await getUserById(userId);
		if (user && user.phone_number) {
			// Check if the phone number is in E.164 format
			const e164Regex = /^\+[1-9]\d{1,14}$/;
			if (e164Regex.test(user.phone_number)) {
				return user.phone_number;
			} else {
				// If not, throw an error
				throw new Phone_Number_Bad_Format(
					"Phone number is not in E.164 format"
				);
			}
		} else {
			// If there's no phone number, throw an error
			throw new Phone_Number_Not_Found("No number found");
		}
	} catch (error) {
		// Log the error (perhaps consider a more sophisticated error handling strategy)
		logger.log("error", `[getUserPhoneNumber] Error: ${error}`);
		// Rethrow the error so it can be handled by the caller
		throw error;
	}
};

/**
 * Adds or updates the `daysInAdvance` value for upcoming payments in the user's metadata.
 * @async
 * @function addDaysInAdvanceToMetadata
 * @param {Request} request - Express request object containing the user ID and days in advance value.
 * @param {Response} response - Express response object used to send the response.
 * @throws Will throw an error if unable to update the user metadata.
 */
export const addDaysInAdvanceToMetadata = async (
	request: Request,
	response: Response
) => {
	const userId = request.params.id;
	const daysInAdvance = request.body.daysInAdvance;
	try {
		await updateUserMetadata(userId, {daysInAdvance});
		response.json({message: "Days in advance updated successfully."});
	} catch (error) {
		logger.log(
			"error",
			`Error updating days in advance for upcoming payments for user with ID ${userId}:`,
			error
		);

		response.status(500).json({
			message: `Failed to update days in advance for upcoming payments: ${error}`,
		});
	}
};
