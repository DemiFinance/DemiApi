import axios, {AxiosRequestConfig} from "axios";
import {Request, response, Response} from "express";

import {ManagementClient, AuthenticationClient, UserMetadata} from "auth0";

const auth0 = new ManagementClient({
	domain: "dev-0u7isllacvzlfhww.auth0.com",
	clientId: "HNgNV6QQAj3T9ThpRMhTY0rGqAGfzeTn",
	clientSecret: process.env.AUTH0_CLIENT_SECRET!,
	scope: "read:users update:users",
	audience: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
});

const auth0Auth = new AuthenticationClient({
	domain: "dev-0u7isllacvzlfhww.auth0.com",
	clientId: "HNgNV6QQAj3T9ThpRMhTY0rGqAGfzeTn",
	clientSecret: process.env.AUTH0_CLIENT_SECRET!,
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
			client_secret: process.env.AUTH0_CLIENT_SECRET!,
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
			url: "https://{yourDomain}/api/v2/users",
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
