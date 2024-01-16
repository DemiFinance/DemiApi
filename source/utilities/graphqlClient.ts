// Import necessary modules from Apollo Client
import {ApolloClient, InMemoryCache, HttpLink} from "@apollo/client/core";

import {
	MxTransactionsByAccountId,
	HolderFromAccountId,
	GetProfileId,
	AccountDetailsByAccountId,
} from "./graphqlSchema";

import {refreshSessionToken} from "./quilttUtil";

const URI = "https://api.quiltt.io/v1/graphql";

/**
 * Creates an instance of Apollo Client with the provided session token.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @return {ApolloClient} The Apollo Client instance.
 */
export function createApolloClient(sessionToken: string) {
	const httpLink = new HttpLink({
		uri: URI,
		headers: {
			Authorization: `Bearer ${sessionToken}`,
			"Content-Type": "application/json",
		},
	});

	return new ApolloClient({
		link: httpLink,
		cache: new InMemoryCache(),
	});
}

/**
 * Executes a GraphQL query, refreshing the session token if necessary.
 *
 * @param {string} quilttUserId - The quiltt user id to generate session token.
 * @param {any} query - The GraphQL query to execute.
 * @param {any} variables - The variables for the GraphQL query.
 * @return {Promise<any>} The data returned from the GraphQL query.
 * @throws Will throw an error if unable to refresh the session token or if the GraphQL query fails.
 */
export async function executeQuery(
	quilttUserId: string,
	query: any,
	variables: any
): Promise<any> {
	try {
		const sessionToken = await refreshSessionToken(quilttUserId);

		const client = createApolloClient(sessionToken);
		const response = await client.query({
			query,
			variables,
		});

		if (response.errors && response.errors.length > 0) {
			throw new Error(
				`GraphQL errors: ${response.errors
					.map((error) => error.message)
					.join(", ")}`
			);
		}

		return response.data;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

/**
 * Retrieves the holder from a specific account ID.
 *
 * @param {string} quilttUserId - The session token for authentication.
 * @param {string} accountId - The account ID.
 * @return {Promise<string>} The holder associated with the account ID.
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function holderFromAccountId(
	quilttUserId: string,
	accountId: string
): Promise<string> {
	try {
		const response = await executeQuery(quilttUserId, HolderFromAccountId, {
			accountId,
		});

		const resultString = response.account.sources[0]?.userId;

		if (typeof resultString !== "string") {
			throw new Error("Unexpected data format: expected a string");
		}

		return resultString;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

/**
 * Retrieves profile ID.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @return {Promise<any>} The profile ID.
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function getProfileId(sessionToken: string): Promise<any> {
	try {
		const client = createApolloClient(sessionToken);
		const response = await client.query({query: GetProfileId});

		if (response.errors && response.errors.length > 0) {
			throw new Error(
				`GraphQL errors: ${response.errors
					.map((error) => error.message)
					.join(", ")}`
			);
		}

		return response.data;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

/**
 * Retrieves account details by account ID.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @param {string} accountId - The account ID.
 * @return {Promise<any>} The account details associated with the account ID.
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function accountDetailsById(
	sessionToken: string,
	accountId: string
): Promise<any> {
	try {
		const client = createApolloClient(sessionToken);
		const response = await client.query({
			query: AccountDetailsByAccountId,
			variables: {accountId},
		});

		if (response.errors && response.errors.length > 0) {
			throw new Error(
				`GraphQL errors: ${response.errors
					.map((error) => error.message)
					.join(", ")}`
			);
		}

		return response.data;
	} catch (error) {
		console.error(error);
		throw error;
	}
}

/**
 * Retrieves transactions by account ID.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @param {string} accountId - The account ID.
 * @return {Promise<any>} The transactions associated with the account ID.
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */

/**
 * Retrieves transactions by account ID.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @param {string} accountId - The account ID.
 * @return {Promise<any>} The transactions associated with the account ID.
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function mxTransactionsByAccountId(
	sessionToken: string,
	accountId: string
): Promise<any> {
	try {
		const client = createApolloClient(sessionToken);
		const response = await client.query({
			query: MxTransactionsByAccountId,
			variables: {accountId},
		});

		if (response.errors && response.errors.length > 0) {
			throw new Error(
				`GraphQL errors: ${response.errors
					.map((error) => error.message)
					.join(", ")}`
			);
		}

		return response.data;
	} catch (error) {
		console.error(error);
		throw error;
	}
}
/**
 * Retrieves the Quiltt UUID associated with a specific user ID.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @param {string} userId - The user ID whose Quiltt UUID is to be retrieved.
 * @return {Promise<string>} The Quiltt UUID associated with the user ID.
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function getQuilttUuidByUserId(
	sessionToken: string,
	userId: string
): Promise<string> {
	try {
		// Create an Apollo client with the provided session token.
		const client = createApolloClient(sessionToken);

		// Send a query to get the profile ID.
		const response = await client.query({
			query: GetProfileId,
			variables: {userId},
		});

		// Check for errors in the GraphQL response.
		if (response.errors && response.errors.length > 0) {
			throw new Error(
				`GraphQL errors: ${response.errors
					.map((error) => error.message)
					.join(", ")}`
			);
		}

		return response.data.profile.uuid;
	} catch (error) {
		console.error(error);
		throw error; // Re-throw the error after logging it.
	}
}

// // Usage
// const sessionToken = "your-session-token";
// const accountId = "some-account-id";

// holderFromAccountId(sessionToken, accountId)
// 	.then((data) => console.log(data))
// 	.catch((error) => console.error(error));

// transactionsByAccountId(sessionToken, accountId)
// 	.then((data) => console.log(data))
// 	.catch((error) => console.error(error));
