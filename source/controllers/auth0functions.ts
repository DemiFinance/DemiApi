import axios from "axios";

import {ManagementClient, UserMetadata} from "auth0";

//var ManagementClient = require('auth0').ManagementClient;

export async function pushMetadata(userId: string, metadata: UserMetadata) {
	const management = new ManagementClient({
		token: await getToken(),
		audience: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
		//audience: "https://api.demifinance.com",
		domain: "dev-0u7isllacvzlfhww.auth0.com",
		clientId: "HNgNV6QQAj3T9ThpRMhTY0rGqAGfzeTn",
		clientSecret: process.env.AUTH0_CLIENT_SECRET!,
		scope: "read:users update:users",
	});

	const params = {id: userId};
	management
		.updateUserMetadata(params, metadata)
		.then((updatedMetaData: {[key: string]: any}) => {
			console.log("updated user metadata: ", updatedMetaData);
		})
		.catch((error: Error) => {
			console.error(error.message);
		});
}

/**
 * Update a user's metadata in Auth0.
 *
 * @param accessToken The Auth0 Management API access token.
 * @param userId The ID of the user to update.
 * @param metadata The metadata to set for the user.
 * @returns The updated user object.
 */
export async function updateUserMetadata(
	accessToken: string,
	userId: string,
	metadata: {[key: string]: any}
): Promise<any> {
	try {
		// Define the headers to send with the API request
		// const headers = {
		// 	"Content-Type": "application/json",
		// 	"authorization": `Bearer ${accessToken}`,
		// };

		// console.log(`[UPDATEUSERMETA] Headers: ${headers}`);

		// Define the endpoint to update the user's metadata
		const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;

		// Send a PATCH request to the Auth0 Management API to update the user's metadata
		const response = await axios.patch(
			endpoint,
			{user_metadata: metadata},
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

export async function getToken(): Promise<string> {
	const options = {
		method: "POST",
		url: "https://dev-0u7isllacvzlfhww.us.auth0.com/oauth/token",
		headers: {"content-type": "application/x-www-form-urlencoded"},
		data: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: "HNgNV6QQAj3T9ThpRMhTY0rGqAGfzeTn",
			client_secret: process.env.AUTH0_CLIENT_SECRET!,
			audience: "https://api.demifinance.com",
		}),
	};

	try {
		const response = await axios.request(options);
		return response.data.access_token;
	} catch (error) {
		console.error(error);
		return "";
	}
}
