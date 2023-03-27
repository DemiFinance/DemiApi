import * as dotenv from "dotenv";
dotenv.config();
import {Request, response, Response} from "express";
import axios, {AxiosResponse} from "axios";

import {Entity, Individual} from "../../models/entity";
import {Address} from "../../models/address";

import {Method, Environments} from "method-node";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.sandbox,
});

//working
const newAuthSession = async (request: Request, response: Response) => {
	//const id: string = request.params.id;
	const id  = "ent_JFMar7hpLxwP7";
	const token = await method.elements.createToken({
		entity_id: id,
		team_name: "Demi Finance",
		team_icon: process.env.LOGO_URL!,
		team_logo: process.env.LOGO_URL!,
		type: "auth",
		auth: {},
	});

	return response.status(200).json({
		element_token: token.element_token,
	});
};

export default {newAuthSession};
