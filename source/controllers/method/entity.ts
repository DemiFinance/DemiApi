// import * as dotenv from 'dotenv';
// dotenv.config();
import {Request, Response} from "express";

import {Method, Environments} from "method-node";
import {updateUserMeta, getToken} from "../auth0functions";
import {log} from "console";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY ? process.env.METHOD_API_KEY : undefined,
	env: Environments.production,
});

//TODO - Needs
/**
 * 1. create new entity
 * 1.1 Recieve name + phone number from App
 * 1.2 Push name + number to method
 * 1.3 retrieve created entity from method
 * 1.4 push entity information + user info to database
 * 1.5 return entity info to app?
 */

const testWithMethod = async (request: Request, response: Response) => {
	try {
		const ent = await method.entities.create({
			type: "individual",
			individual: {
				first_name: "Connor",
				last_name: "Testingname",
				phone: "+19056162504",
			},
		});
		console.log("[ENTITY] " + JSON.stringify(ent));

		return response.status(200).json({
			entity: ent,
		});
	} catch (error) {
		console.log("[ENTITY ERROR] " + error);
	}
};

const postEntity = async (request: Request, response: Response) => {
	log("Attempting to create new entity... " + JSON.stringify(request.body));
	try {
		const {auth0_id, first_name, last_name, phone} = request.body;

		// Validate request body
		if (!auth0_id || !first_name || !last_name || !phone) {
			return response.status(400).json({error: "Invalid request body"});
		}

		// Create a new entity
		const newEntity = await method.entities.create({
			type: "individual",
			individual: {
				first_name,
				last_name,
				phone,
			},
		});

		// Update the user's metadata in Auth0
		const metadata = {
			entity_id: newEntity.id,
		};

		const tokena = await getToken();
		await updateUserMeta(tokena, auth0_id, first_name, last_name, metadata);

		return response.status(200).json({newEntity});
	} catch (error) {
		console.error("Error creating new entity:", error);
		return response.status(500).json({error: "Failed to create new entity"});
	}
};

//this works
const getEntity = async (request: Request, response: Response) => {
	const id: string = request.params.id;
	const requestedEntity: any = await method.entities.get(id)!;

	console.log("requested entity" + requestedEntity);

	return response.status(200).json({
		entity: requestedEntity,
	});
};

export default {getEntity, postEntity, testWithMethod};
