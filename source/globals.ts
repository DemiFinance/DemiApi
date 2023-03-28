const {auth} = require("express-oauth2-jwt-bearer");
import {Method, Environments} from "method-node";

export const jwtCheck = auth({
	audience: "https://api.demifinance.com",
	issuerBaseURL: "https://auth.demifinance.com/",
	tokenSigningAlg: "RS256",
});

export const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.sandbox,
});
