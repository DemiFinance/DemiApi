import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";

import {Method, Environments} from "method-node";
import {log} from "console";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.production,
});

const newAuthSession = async (request: Request, response: Response) => {
	try {
		const id = request.params.id;

		// Validate id
		if (!id || typeof id !== "string") {
			return response.status(400).json({error: "Invalid id parameter"});
		}

		const token = await method.elements.createToken({
			entity_id: id,
			team_name: "Demi Finance",
			team_icon: process.env.LOGO_URL,
			team_logo: process.env.LOGO_URL,
			type: "auth",
			auth: {},
		});

		if (!token || !token.element_token) {
			throw new Error("Failed to create token");
		}

		console.log(token.element_token);

		return response.status(200).json({
			element_token: token.element_token,
		});
	} catch (error) {
		console.error("Error creating new auth session:", error);
		return response
			.status(500)
			.json({error: "Failed to create new auth session"});
	}
};

export default {newAuthSession};
