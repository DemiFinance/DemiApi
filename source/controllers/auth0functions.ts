import fetch from "node-fetch";

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
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};

		// Define the endpoint to update the user's metadata
		const endpoint = `https://auth.demifinance.com/api/v2/users/${userId}`;

		// Send a PATCH request to the Auth0 Management API to update the user's metadata
		const response = await fetch(endpoint, {
			method: "PATCH",
			headers,
			body: JSON.stringify({user_metadata: metadata}),
		});

		// Parse the response JSON and return it
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(
			`Error updating user metadata for user with ID ${userId}:`,
			error
		);
		throw new Error("Failed to update user metadata");
	}
}
