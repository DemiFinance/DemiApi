import axios, {AxiosRequestConfig} from "axios";
import {Request, Response} from "express";

import {AuthenticationClient} from "auth0";
import {
	Auth0_Metadata_Search_Error,
	Phone_Number_Not_Found,
} from "../utilities/errors/demierrors";
import {AppMetadata, User} from "../models/auth0";

const auth0Auth = new AuthenticationClient({
	domain: "dev-0u7isllacvzlfhww.auth0.com",
	clientId: "HNgNV6QQAj3T9ThpRMhTY0rGqAGfzeTn",
	clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
});

// Example function to obtain an access token with the necessary scopes
export const getAccessToken = async (): Promise<string> => {
	console.log("Attempting Token Retrevial");
	try {
		const tokenResponse = await auth0Auth.clientCredentialsGrant({
			audience: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
			scope: "read:users update:users",
		});

		return tokenResponse.access_token;
	} catch (err) {
		console.error("Token Gathering Failed");

		console.error(err);
		return "";
	}
};

export async function getToken(): Promise<string> {
	const options = {
		method: "POST",
		url: "https://dev-0u7isllacvzlfhww.us.auth0.com/oauth/token",
		headers: {"content-type": "application/x-www-form-urlencoded"},
		data: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: "zkCzuZm3qchILm3LCbYXicdPIzF90EUg",
			client_secret: process.env.AUTH0_CLIENT_SECRET || "",
			audience: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
		}),
	};

	try {
		const response = await axios.request(options);
		console.log("[AUTH0 Response - Token] " + response.data.access_token);

		return response.data.access_token;
	} catch (error) {
		console.error("[AUTH0 Response - Token Fetching Error] " + error);
		return "";
	}
}

/**
 * Update a user's metadata in Auth0.
 *
 * @param accessToken The Auth0 Management API access token.
 * @param userId The ID of the user to update.
 * @param metadata The metadata to set for the user.
 * @returns The updated user object.
 */
export async function updateUserMeta(
	accessToken: string,
	userId: string,
	givenName: string,
	familyName: string,
	metadata: {[key: string]: any}
): Promise<any> {
	try {
		const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;

		// Send a PATCH request to the Auth0 Management API to update the user's metadata
		const response = await axios.patch(
			endpoint,
			{
				name: `${givenName} ${familyName}`,
				given_name: givenName,
				family_name: familyName,
				app_metadata: metadata,
			},
			{
				headers: {
					authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);

		// Return the response data
		return response.data;
	} catch (error) {
		console.error(
			`Error updating user metadata for user with ID ${userId}:`,
			error
		);
		throw new Error("Failed to update user metadata");
	}
}

export const getNotificationTokenByEntyityId = async (
	request: Request,
	response: Response
) => {
	try {
		const entityId: string = request.params.id;

		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users",
			params: {
				q: `app_metadata.notificationToken:"${entityId}"`,
				search_engine: "v3",
			},
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);
		console.log("requested entity", data);

		// Assuming the first user in the returned array is the relevant user
		const appMetadata = data[0]?.app_metadata.notificationToken;

		return response.status(200).json({
			entity: appMetadata,
		});
	} catch (error) {
		console.error(error);
		return response.status(500).json({error: "Internal server error"});
	}
};

/**
 * Fetches the number of days in advance a user has selected for their notification based on the entity ID.
 *
 * @async
 * @function fetchDaysInAdvanceByEntityId
 * @param {string} entityId - The entity ID associated with the user.
 * @returns {Promise<number|null>} The number of days in advance or null if there's an error or if the data is not available.
 * @throws {Error} Throws an error if there's a failure in fetching the data.
 */
export const fetchDaysInAdvanceByEntityId = async (
	entityId: string
): Promise<number | null> => {
	try {
		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users",
			params: {
				q: `app_metadata.daysInAdvance:"${entityId}"`,
				search_engine: "v3",
			},
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);
		console.log("requested entity", data);

		// Assuming the first user in the returned array is the relevant user
		return data[0]?.app_metadata.daysInAdvance || null;
	} catch (error) {
		console.error(error);
		return null;
	}
};

/**
 * Fetches the `daysInAdvance` value from the `app_metadata` of a specified user in Auth0 using their `userId`.
 *
 * @async
 * @param {string} userId - The identifier of the user in Auth0.
 * @returns {Promise<number|null>} - A Promise that resolves to the `daysInAdvance` value as a number,
 *                                   or null if the value is not found or an error occurs.
 * @throws Will throw an error if unable to retrieve the token or make the API request.
 *
 * @example
 * const daysInAdvance = await fetchDaysInAdvanceByUserId('user123');
 */
export const fetchDaysInAdvanceByUserId = async (
	userId: string
): Promise<number | null> => {
	try {
		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`,
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);
		console.log("requested user", data);

		// Assuming the data object is the relevant user
		return data?.app_metadata.daysInAdvance || null;
	} catch (error) {
		console.error(error);
		return null;
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
		const daysInAdvance = await fetchDaysInAdvanceByUserId(entityId);
		return response.status(200).json({daysInAdvance});
	} catch (error) {
		console.error(error);
		return response.status(500).json({error: "Internal server error"});
	}
};

/**
 * Retrieves the entity ID associated with a given Quiltt account ID by querying the Auth0 Management API.
 *
 * @param {string} quilttUuid - The Quiltt UUID used to search the user's metadata.
 * @returns {Promise<string>} A promise that resolves to the entity ID if found, or rejects with an error if not found or if the request fails.
 * @throws Will throw an error if the request fails or if no user with a matching Quiltt account ID is found.
 * @async
 */
export const getEntityIdByQuilttAccount = async (
	quilttUuid: string
): Promise<string> => {
	try {
		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users",
			params: {
				q: `app_metadata.quiltt_uuid:"${quilttUuid}"`,
				search_engine: "v3",
			},
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);

		// Assuming the first user in the returned array is the relevant user
		const entityId = data[0]?.app_metadata.entity_id;

		if (!entityId) {
			throw new Error(`No matching entity found with uuid ${quilttUuid}`);
		}

		return entityId;
	} catch (error) {
		console.error(error);
		throw error; // Re-throw the error to be handled by the calling function
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
	const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${entityId}`;
	const requestPayload = {
		app_metadata: {
			quiltt_account_id: quilttId,
		},
	};

	try {
		const accessToken = await getToken();
		const requestHeaders = {
			authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		const axiosConfig: AxiosRequestConfig = {
			method: "PATCH",
			url: endpoint,
			headers: requestHeaders,
			data: requestPayload,
		};

		await axios.request(axiosConfig);
		console.log("Metadata updated successfully");
	} catch (error) {
		console.error("Error updating metadata:", error);
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
	const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${auth0Id}`;
	const requestPayload = {
		app_metadata: {
			quiltt_uuid: uuid,
		},
	};

	try {
		const accessToken = await getToken();
		const requestHeaders = {
			authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		const axiosConfig: AxiosRequestConfig = {
			method: "PATCH",
			url: endpoint,
			headers: requestHeaders,
			data: requestPayload,
		};

		await axios.request(axiosConfig);
		console.log("Metadata updated successfully: Quiltt UUID");
	} catch (error) {
		console.error("Error updating metadata:", error);
		throw error; // Re-throw the error to be handled by the calling function
	}
};

export const getQuilttIdByUserId = async (
	userId: string
): Promise<string | null> => {
	try {
		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`,
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);

		// Assuming the data object is the relevant user
		return data?.app_metadata.quiltt_account_id || null;
	} catch (error) {
		console.error(`Failed to get QuilttId By User ID ${error}`);
		return null;
	}
};

/**
 * Constructs a query string for searching users by Quiltt account ID.
 * @param {keyof User} field - The field to search by. This argument is not used, but is included for compatibility with the ConstructQueryCallback type.
 * @param {string | number} value - The value to search for.
 * @returns {string} The constructed query string.
 */
const constructQuilttIdQuery: ConstructQueryCallback = (
	field: keyof User,
	value: string | number
) => `app_metadata.quiltt_account_id:"${value}"`;

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
	try {
		const user = await getUserByQuery(constructQuilttIdQuery, quilttAccountId);
		if (!user) {
			throw new Auth0_Metadata_Search_Error(
				`No matching entity found with Quiltt Account ID ${quilttAccountId}`
			);
		}
		return user.user_id;
	} catch (error) {
		console.error(error);
		throw new Auth0_Metadata_Search_Error(
			`Error fetching user data: ${(error as Error).message}`
		);
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
		const user = await getUserByField("user_id", userId);
		if (user && user.phone_number) {
			return user.phone_number;
		} else {
			throw new Phone_Number_Not_Found("No number found");
		}
	} catch (error) {
		console.error(error);
		return "No number found";
	}
};

/**
 * Fetches user data based on a specified field and value from the Auth0 Management API.
 *
 * @async
 * @function
 * @param {keyof User} field - The field to search by.
 * @param {string | number} value - The value to search for.
 * @returns {Promise<User | null>} A Promise that resolves to the user data if found, or null if not found or an error occurs.
 * @throws Will throw an error if unable to retrieve the token or make the API request.
 */
export const getUserByField = async (
	field: keyof User,
	value: string | number
): Promise<User | null> => {
	try {
		const token = await getToken();
		let url: string;
		let options: AxiosRequestConfig;

		if (field === "user_id") {
			// If the field is user_id, construct the URL to directly query the user
			url = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${value}`;
			options = {
				method: "GET",
				url,
				headers: {authorization: `Bearer ${token}`},
			};
		} else {
			// For other fields, construct the URL to perform a search
			url = "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users";
			options = {
				method: "GET",
				url,
				params: {
					q: `${field}:"${value}"`,
					search_engine: "v3",
				},
				headers: {authorization: `Bearer ${token}`},
			};
		}

		const {data} = await axios.request(options);

		// If the field is user_id, the data object is the relevant user
		// Otherwise, assuming the first user in the returned array is the relevant user
		const user = field === "user_id" ? data : data[0];
		return user || null;
	} catch (error) {
		console.error(error);
		return null;
	}
};

/**
 * Callback to construct a query string for fetching user data.
 * @callback ConstructQueryCallback
 * @param {keyof User} field - The field to search by.
 * @param {string | number} value - The value to search for.
 * @returns {string} The constructed query string.
 */
type ConstructQueryCallback = (
	field: keyof User,
	value: string | number
) => string;

/**
 * Fetches user data based on a specified query from the Auth0 Management API.
 * @async
 * @function getUserByQuery
 * @param {ConstructQueryCallback} constructQuery - The callback to construct the query string.
 * @param {string | number} value - The value to search for.
 * @returns {Promise<User>} A Promise that resolves to the user data if found.
 * @throws Will throw an Auth0_Metadata_Search_Error if no user is found or if unable to make the API request.
 */
export const getUserByQuery = async (
	constructQuery: ConstructQueryCallback,
	value: string | number
): Promise<User> => {
	try {
		const token = await getToken();
		const url = "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users";
		const queryString = constructQuery("app_metadata", value);

		const options: AxiosRequestConfig = {
			method: "GET",
			url,
			params: {
				q: queryString,
				search_engine: "v3",
			},
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);

		// Iterate over the returned users to find the matching user
		for (const user of data) {
			if (user.app_metadata && user.app_metadata.quiltt_account_id === value) {
				return user;  // Return the matching user
			}
		}

		// If no matching user is found, throw an error
		throw new Auth0_Metadata_Search_Error(
			`No matching user found for value: ${value}`
		);

	} catch (error) {
		console.error(error);
		throw new Auth0_Metadata_Search_Error(
			`Error fetching user data: ${(error as Error).message}`
		);
	}
};


/**
 * Updates user metadata in the Auth0 Management API.
 *
 * @async
 * @function updateUserMetadata
 * @param {string} userId - The user ID of the user to update.
 * @param {Partial<AppMetadata>} metadata - The updated metadata.
 * @returns {Promise<void>} A Promise that resolves when the metadata has been successfully updated.
 * @throws Will throw an error if unable to retrieve the token or make the API request.
 */
export const updateUserMetadata = async (
	userId: string,
	metadata: Partial<AppMetadata>
): Promise<void> => {
	const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;
	const requestPayload = {app_metadata: metadata}; // Updated to directly use the metadata param

	try {
		const accessToken = await getToken();
		const requestHeaders = {
			authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		const axiosConfig: AxiosRequestConfig = {
			method: "PATCH",
			url: endpoint,
			headers: requestHeaders,
			data: requestPayload,
		};

		await axios.request(axiosConfig);
		console.log("User metadata updated successfully");
	} catch (error) {
		console.error("Error updating user metadata:", error);
		throw error;
	}
};

/**
 * Adds or updates the `notificationToken` value in the user's metadata.
 * @async
 * @function addNotificationTokenToMetadata
 * @param {Request} request - Express request object containing the user ID and token string.
 * @param {Response} response - Express response object used to send the response.
 * @throws Will throw an error if unable to update the user metadata.
 */
export const addNotificationTokenToMetadata = async (
	request: Request,
	response: Response
) => {
	const {userId, tokenString} = request.body;
	try {
		await updateUserMetadata(userId, {notificationToken: tokenString});
		response.json({message: "Notification token updated successfully."});
	} catch (error) {
		console.error(
			`Error updating user notification token for user with ID ${userId}:`,
			error
		);
		response
			.status(500)
			.json({message: `Failed to update user notification token: ${error}`});
	}
};

/**
 * Retrieves the notification token of a user based on the entity ID.
 * @async
 * @function getNotificationTokenByEntityId
 * @param {Request} request - Express request object.
 * @param {Response} response - Express response object.
 * @throws Will throw an error if unable to fetch the user metadata.
 */
export const getNotificationTokenByEntityId = async (
	request: Request,
	response: Response
) => {
	const entityId: string = request.params.id;
	try {
		const user = await getUserByQuery(
			(field, value) => `${field}.notificationToken:"${value}"`,
			entityId
		);
		if (!user) throw new Error(`User not found for entity ID: ${entityId}`);
		const appMetadata = user.app_metadata.notificationToken;
		response.status(200).json({entity: appMetadata});
	} catch (error) {
		console.error(error);
		response.status(500).json({error: "Internal server error"});
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
		console.error(
			`Error updating days in advance for upcoming payments for user with ID ${userId}:`,
			error
		);
		response.status(500).json({
			message: `Failed to update days in advance for upcoming payments: ${error}`,
		});
	}
};
