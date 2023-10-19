// Import necessary modules from Apollo Client
import {ApolloClient, InMemoryCache, HttpLink} from "@apollo/client/core";

import {
	TransactionsByAccountId,
	HolderFromAccountId,
	GetProfileId,
	AccountDetailsByAccountId,
} from "./graphqlSchema";

// Define the URI as a constant
const URI = "https://api.quiltt.io/v1/graphql";

// Helper function to create Apollo Client
function createApolloClient(sessionToken: string) {
	const httpLink = new HttpLink({
		uri: URI, // Use the constant URI here
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

export async function holderFromAccountId(
	sessionToken: string,
	accountId: string
): Promise<any> {
	const client = createApolloClient(sessionToken);
	const response = await client.query({
		query: HolderFromAccountId,
		variables: {accountId},
	});
	return response.data;
}

export async function getProfileId(sessionToken: string): Promise<any> {
	const client = createApolloClient(sessionToken);
	const response = await client.query({query: GetProfileId});
	return response.data;
}

export async function accountDetailsById(
	sessionToken: string,
	accountId: string
): Promise<any> {
	const client = createApolloClient(sessionToken);
	const response = await client.query({
		query: AccountDetailsByAccountId,
		variables: {accountId},
	});
	return response.data;
}

export async function transactionsByAccountId(
	sessionToken: string,
	accountId: string
): Promise<any> {
	const client = createApolloClient(sessionToken);
	const response = await client.query({
		query: TransactionsByAccountId,
		variables: {accountId},
	});
	return response.data;
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
