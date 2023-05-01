import axios from "axios";

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

// Example request to update a user's metadata
export const updateUserMetadata = async (
	token: string,
	userId: string,
	metadata: Record<string, any>
) => {
	try {
		const auth0WithToken = new ManagementClient({
			domain: "dev-0u7isllacvzlfhww.auth0.com",
			clientId: "zkCzuZm3qchILm3LCbYXicdPIzF90EUg",
			clientSecret: process.env.AUTH0_CLIENT_SECRET!,
			scope: "read:users update:users",
			//audience: "https://api.demifinance.com",
			audience: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
			token: token,
		});
		const updatedUser = await auth0WithToken.updateUserMetadata(
			{id: userId},
			metadata
		);
		console.log(
			"[AUTH0 Response] - Update User Metadata" + updatedUser.user_metadata
		);
	} catch (err) {
		console.error(err);
	}
};

export async function pushMetadata(userId: string, metadata: UserMetadata) {
	const management = new ManagementClient({
		token: await getToken(),
		//audience: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
		//audience: "https://api.demifinance.com",
		domain: "dev-0u7isllacvzlfhww.auth0.com",
		//clientId: "HNgNV6QQAj3T9ThpRMhTY0rGqAGfzeTn",
		//clientSecret: process.env.AUTH0_CLIENT_SECRET!,
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
export async function updateUserMeta(
	accessToken: string,
	userId: string,
	familyName: string,
	givenName: string,
	metadata: {[key: string]: any}
): Promise<any> {
	try {
		const endpoint = `https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/users/${userId}`;

		// Send a PATCH request to the Auth0 Management API to update the user's metadata
		const response = await axios.patch(
			endpoint,
			{name: `${familyName} ${givenName}`, given_name: givenName, family_name: familyName, app_metadata: metadata},
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
