import {Request, Response} from "express";
import axios from "axios";

async function getPhoneNumber(): Promise<string> {
	//use auth0 token to extract phone number from user metadata

	//format number to ensure E1.164 formatting

	return "lol";
}

/**
 * Generates a session token by making a POST request to the Quiltt API.
 *
 * @async
 * @function
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} authToken - Authorization token.
 * @throws Will throw an error if the axios POST request fails.
 * @returns {Promise<string>} The session token.
 */
async function generateToken(): Promise<string> {
	const authToken: string | undefined = process.env.QUILTT_TOKEN;
	const url: string = "https://api.quiltt.io/v1/users/sessions";

	if (!authToken) {
		console.error("QUILTT_TOKEN environment variable is not set or is blank");
		throw new Error("Internal Server Error");
	}

	try {
		const phoneNumber: string = await getPhoneNumber();

		const data = {
			phoneNumber: phoneNumber,
		};

		const config = {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		};

		const response = await axios.post(url, data, config);
		return response.data.sessionToken;
	} catch (error: any) {
		console.error("Error generating session token:", error.message);
		if (error.response) {
			console.error("Response data:", error.response.data);
			console.error("Response status:", error.response.status);
			throw new Error(
				`Error: ${error.response.status}, ${JSON.stringify(
					error.response.data
				)}`
			);
		} else {
			throw new Error("Internal Server Error");
		}
	}
}

/**
 * Express.js handler function to generate a session token and return it in the HTTP response.
 *
 * @async
 * @function
 * @param {Request} req - Express.js request object.
 * @param {Response} res - Express.js response object.
 * @returns {Promise<void>}
 */
export async function handleGenerateSessionToken(
	req: Request,
	res: Response
): Promise<void> {
	try {
		const sessionToken: string = await generateToken();
		res.status(200).json({sessionToken});
	} catch (error: any) {
		console.error(error.message);
		const isInternalError = error.message.includes("Internal Server Error");
		res.status(isInternalError ? 500 : 400).json({error: error.message});
	}
}

//logic for webhook reciept
//WEBHOOK EXAMPLE
/**
 * {
  "eventTypes": ["profile.created"],
  "events": [
    {
      "id": "2Zj5zzFU3a9abcZ1aYYYaaZ1",
      "type": "profile.created",
      "record": {
        "userId": "p_14BOrXExqvQhIGFgGVdZmKk",
        "environmentId": "env_16dkW8PhTJkZVfcptQsZzNS",
        "name": "Joe Allen Maldonado-Passage",
        "email": "joe@joeexoticusa.com",
        ...
      }
    }
  ]
}

we can assume that for a new account, the event would be account.create and there would be a field accountId 
 */
// 1. pull accountid from webhook and store in a param -> literally everything will need to use this
// 2. use quilt REST API to pull account and routing numbers for the ID
//	- API endpoint is https://api.quiltt.io/v1/accounts/{id}/ach
//	- API Auth is with an Authorization Header with format Authorization: Bearer {MY_API_KEY}
//	- The api key can be retrieved from an environment variable QUILTT_TOKEN
// 3. Creat new method account for the user that should own the new ach account.
/**
 * 	Creating a method account is 
 * const account: any = await method.accounts.create({
			holder_id: request.body.id,
			ach: {
				routing: "ROUTING_NUMBER",
				number: "ACCOUNT_NUMBER",
				type: "checking",
			},
		});
 */
// 4. verify account with account and transactions information from gql queries
/** 
 * i have apollo client added to my api, i have created graphqlClient.ts
 * 
import {ApolloClient, InMemoryCache} from "@apollo/client";

// Define the Quiltt.io API URL
const QUILTT_API_URL = "https://api.quiltt.io/graphql";

// Create a new instance of ApolloClient
const client = new ApolloClient({
	uri: QUILTT_API_URL,
	cache: new InMemoryCache(),
});

// Export the ApolloClient instance
export default client;

 * 



i have created graphqlSchema.ts with 
export const AccountsSchema = gql`
... rest of function here...
`;

export const TransactionsSchema = gql`
... rest of function here...
`;
*/
