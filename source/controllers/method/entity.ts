// import * as dotenv from 'dotenv';
// dotenv.config();
import {Request, response, Response} from "express";
import axios, {AxiosResponse} from "axios";

import {Entity, Individual} from "../../models/entity";
import {Address} from "../../models/address";

import {Method, Environments} from "method-node";

import {
	updateUserMeta,
	updateUserMetadata,
	getToken,
	getAccessToken,
	pushMetadata,
} from "../auth0functions";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.sandbox,
});

const tempAddy: Address = {
	line1: "485 Sandmere Place",
	city: "Oakvbille",
	state: "TX",
	zip: "90210",
};

const testPerson: Individual = {
	first_name: "John",
	last_name: "Smith",
	phone: "19056162504",
	email: null,
	dob: null,
};

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
	try {
		console.log("Request body from new entity post request");
		console.log(request.body);
		console.log("Body end");

		// Create a new entity
		const newEntity = await method.entities.create({
			type: "individual",
			individual: {
				first_name: request.body.first_name,
				last_name: request.body.last_name,
				phone: request.body.phone,
			},
		});

		// Update the user's metadata in Auth0
		const userId = request.body.auth0_id;
		const firstName = request.body.first_name;
		const lastName = request.body.last_name;
		const metadata = {
			first_name: request.body.first_name,
			//last_name: request.body.last_name,
			entity_id: newEntity.id,
		};

		const tokena = await getToken();

		console.log("[TOKEN RESPONSE]" + JSON.stringify(tokena));

		try {
			updateUserMeta(tokena, userId, firstName, lastName, metadata);
		} catch (error) {
			console.log("[UPDATE METADATA ERROR]" + error);
		}

		console.log("[METHOD - New Entity]" + JSON.stringify(newEntity));

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
