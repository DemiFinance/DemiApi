// import * as dotenv from 'dotenv';
// dotenv.config();
import {Request, response, Response} from "express";
import axios, {AxiosResponse} from "axios";

import {Entity, Individual} from "../../models/entity";
import {Address} from "../../models/address";

import {method} from "../../globals";

import {
	updateUserMeta,
	updateUserMetadata,
	getToken,
	getAccessToken,
	pushMetadata,
} from "../auth0functions";

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
const postEntity = async (request: Request, response: Response) => {
	try {
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
		const metadata = {
			first_name: request.body.first_name,
			last_name: request.body.last_name,
			entity_id: newEntity.id,
		};

		const token = await getToken();

		console.log(token);
		
		updateUserMetadata(token, userId, metadata);

		console.log("Method response from new entity post request");
		console.log("[ENTITY]" + newEntity);
		

		// Push to DB here
		// ...

		return response.status(200).json({newEntity});
	} catch (error) {
		console.error("Error creating new entity:", error);
		return response.status(500).json({error: "Failed to create new entity"});
	}
};

// const postEntity = async (request: Request, response: Response) => {
// 	//1.2 do this

// 	const newEntity = await method.entities.create({
// 		type: "individual",
// 		individual: {
// 			first_name: request.body.first_name,
// 			last_name: request.body.last_name,
// 			phone: request.body.phone,
// 		},
// 	});

// 	//1.3 push name to auth0 metadata

// 	console.log("Method response from new entity post request");

// 	//push to db here... awaiting details on auth implementation

// 	return response.status(200).json({newEntity});
// };

//this works
const getEntity = async (request: Request, response: Response) => {
	const id: string = request.params.id;
	const requestedEntity: any = await method.entities.get(id)!;

	console.log("requested entity" + requestedEntity);

	return response.status(200).json({
		entity: requestedEntity,
	});
};

export default {getEntity, postEntity};
