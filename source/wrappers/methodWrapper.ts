import {Method, Environments} from "method-node";

export const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});
