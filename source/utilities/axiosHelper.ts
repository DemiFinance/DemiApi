import axios from "axios";

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

export const auth0Api = axios.create({
	baseURL: "https://dev-0u7isllacvzlfhww.us.auth0.com/api/v2/",
});

// Set up a request interceptor to attach the token before each request
auth0Api.interceptors.request.use(
	async (config) => {
		const token = await getToken(); // Make sure to implement getToken() to handle token retrieval
		config.headers.Authorization = `Bearer ${token}`;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Error handling function
export const handleApiError = (error: Error) => {
	// Log error or send it to an error tracking service
	console.error(error);
	// Throw a custom error or handle it as needed
	throw new Error("An error occurred while making an API request to Auth0.");
};
