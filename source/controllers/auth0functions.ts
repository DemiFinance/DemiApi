import axios, {AxiosRequestConfig} from "axios";
import {Request, Response} from "express";

import {AuthenticationClient} from "auth0";

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

export async function changeAccountName(
	accessToken: string,
	userId: string,
	accountName: string,
	accountId: string
): Promise<any> {
	try {
		const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;

		// Send a PATCH request to the Auth0 Management API to update the user's metadata to rename a bank account
		const response = await axios.patch(
			endpoint,
			{user_metadata: {account_name: accountName, account_id: accountId}},
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
			`Error updating user account name metadata for user with ID ${userId}:`,
			error
		);
		throw new Error("Failed to update user account name metadata");
	}
}

//returns a token, tested and working

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
			//audience: "https://api.demifinance.com",
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

export const addNotificationTokenToMetadata = async (
	request: Request,
	response: Response
) => {
	// Extract userId and tokenString from request
	const {userId, tokenString} = request.body;

	try {
		// Define the endpoint URL
		const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;

		// Prepare the payload for the PATCH request
		const requestPayload = {
			app_metadata: {
				notificationToken: tokenString,
			},
		};

		// Get the accessToken
		const accessToken = await getToken();

		// Prepare the headers for the PATCH request
		const requestHeaders = {
			authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		// Send the PATCH request to the Auth0 Management API to update the user's metadata
		const axiosResponse = await axios.patch(endpoint, requestPayload, {
			headers: requestHeaders,
		});

		// Send the response data
		response.json(axiosResponse.data);
	} catch (error) {
		// Log and re-throw the error with a descriptive message
		console.error(
			`Error updating user notification token for user with ID ${request.body.userId}:`,
			error
		);
		response.status(500).json({
			message: `Failed to update user notification token: ${error}`,
		});
	}
};

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
 * Adds or updates the `daysInAdvanceForUpcomingPayments` value in the user's metadata.
 *
 * @async
 * @function
 * @param {Request} request - Express request object containing the user ID and days in advance value.
 * @param {Response} response - Express response object used to send the response.
 * @throws Will throw an error if the Auth0 Management API request fails.
 * @returns {Promise<void>}
 */
export const addDaysInAdvanceToMetadata = async (
	request: Request,
	response: Response
) => {
	// Extract userId and daysInAdvance from request
	const userId = request.params.id;
	const daysInAdvance = request.body.daysInAdvance;

	try {
		// Define the endpoint URL
		const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;

		// Prepare the payload for the PATCH request
		const requestPayload = {
			app_metadata: {
				daysInAdvance,
			},
		};

		// Get the accessToken
		const accessToken = await getToken();

		// Prepare the headers for the PATCH request
		const requestHeaders = {
			authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		// Send the PATCH request to the Auth0 Management API to update the user's metadata
		const axiosResponse = await axios.patch(endpoint, requestPayload, {
			headers: requestHeaders,
		});

		// Send the response data
		response.json(axiosResponse.data);
	} catch (error) {
		console.error(
			`Error updating days in advance for upcoming payments for user with ID ${request.body.userId}:`,
			error
		);
		response.status(500).json({
			message: `Failed to update days in advance for upcoming payments: ${error}`,
		});
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

export const getPhoneNumberById = async (userId: string): Promise<string> => {
	try {
		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`,
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);
		console.log("requested phone number", data.phone_number);

		// Extract the phone number from the response data
		const phoneNumber = data.phone_number;

		return phoneNumber;
	} catch (error) {
		console.error(error);
		return "No number found";
	}
};

/**
 * Retrieves the entity ID associated with a given Quiltt account ID by querying the Auth0 Management API.
 *
 * @param {string} quilttAccountId - The Quiltt account ID used to search the user's metadata.
 * @returns {Promise<string>} A promise that resolves to the entity ID if found, or rejects with an error if not found or if the request fails.
 * @throws Will throw an error if the request fails or if no user with a matching Quiltt account ID is found.
 * @async
 */
export const getEntityIdByQuilttAccount = async (
	quilttAccountId: string
): Promise<string> => {
	try {
		const token = await getToken();
		const options: AxiosRequestConfig = {
			method: "GET",
			url: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users",
			params: {
				q: `app_metadata.quiltt_account_id:"${quilttAccountId}"`,
				search_engine: "v3",
			},
			headers: {authorization: `Bearer ${token}`},
		};

		const {data} = await axios.request(options);
		console.log("Requested entityId", data);

		// Assuming the first user in the returned array is the relevant user
		const entityId = data[0]?.app_metadata.entity_id;

		if (!entityId) {
			throw new Error("No matching entity found");
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
