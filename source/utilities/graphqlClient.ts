// Import necessary modules from Apollo Client
import {ApolloClient, InMemoryCache, HttpLink} from "@apollo/client/core";

import {
	MxTransactionsByAccountId,
	MxHolderFromAccountId,
	GetProfileId,
	MxAccountDetailsByAccountId,
	GetAccountType,
	PlaidAccountDetailsByAccountId,
	PlaidTransactionsByAccountId,
} from "./graphqlSchema";

import {refreshSessionToken} from "./quilttUtil";
import {
	Balances,
	extractBalances,
	extractTransactions,
} from "../models/quiltt/plaid";
import logger from "../wrappers/winstonLogging";
import tracer from "dd-trace";

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
		const span = tracer.startSpan("executeQuery");
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

		span.finish();
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
export async function MxholderFromAccountId(
	quilttUserId: string,
	accountId: string
): Promise<string> {
	try {
		const response = await executeQuery(quilttUserId, MxHolderFromAccountId, {
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
 * Retrieves the Plaid account details from a specific account ID.
 *
 * @param {string} quilttUserId - The Quiltt User ID.
 * @param {string} accountId - The account ID.
 * @returns Plaid account details object
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function AccountDetailsByAccountId_Plaid(
	quilttUserId: string,
	accountId: string
): Promise<Balances> {
	try {
		const response = await executeQuery(
			quilttUserId,
			PlaidAccountDetailsByAccountId,
			{
				accountId,
			}
		);

		logger.info(`Plaid account response: ${JSON.stringify(response)}`);

		return extractBalances(response);
	} catch (error) {
		console.error(error);
		throw error;
	}
}

/**
 * Retrieves the Plaid account transactions from a specific account ID.
 *
 * @param {string} quilttUserId - The Quiltt User ID.
 * @param {string} accountId - The account ID.
 * @returns {Promise<PlaidTransaction[]>} Plaid account details object
 * @throws Will throw an error if the network request fails or if the GraphQL query returns errors.
 */
export async function TransactionsByAccountId_Plaid(
	quilttUserId: string,
	accountId: string
): Promise<any> {
	try {
		const span = tracer.startSpan("TransactionsByAccountId_Plaid");

		logger.log(
			"info",
			`Plaid transactions request, Account ID:  ${accountId}, Quiltt User ID: ${quilttUserId}`
		);

		const response = await executeQuery(
			quilttUserId,
			PlaidTransactionsByAccountId,
			{
				accountId,
			}
		);

		logger.info(
			`Plaid transactions response: ${JSON.stringify(
				response
			)} non stringified: ${response}`
		);

		span.finish();

		return extractTransactions(response);
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
			query: MxAccountDetailsByAccountId,
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

/**
 * Retrieves the account type associated with a specific account ID.
 *
 * @param {string} sessionToken - The session token for authentication.
 * @param {string} accountId - The account ID whose account type is to be retrieved.
 * @returns {Promise<string>} The account type associated with the account ID.
 */
export async function getAccountType(
	sessionToken: string,
	accountId: string
): Promise<string> {
	try {
		const client = createApolloClient(sessionToken);
		const response = await client.query({
			query: GetAccountType,
			variables: {accountId},
		});

		if (response.errors && response.errors.length > 0) {
			throw new Error(
				`GraphQL errors: ${response.errors
					.map((error) => error.message)
					.join(", ")}`
			);
		}

		return response.data.account.type;
	} catch (error) {
		console.error(error);
		throw error;
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
