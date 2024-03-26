// import * as dotenv from 'dotenv';
// dotenv.config();
import {Request, Response} from "express";
//import axios, {AxiosResponse} from "axios";

import {Method, Environments, IEntity} from "method-node";

import {updateUserMeta} from "../auth0functions";
import logger from "../../wrappers/winstonLogging";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

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
		logger.log("info", "Entity created: ", JSON.stringify(ent));

		return response.status(200).json({
			entity: ent,
		});
	} catch (error) {
		logger.log("error", "Error creating new entity:", error);
	}
};

const postEntity = async (request: Request, response: Response) => {
	logger.log(
		"info",
		"Attempting to create new entity... " + JSON.stringify(request.body)
	);
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

		await updateUserMeta(auth0_id, first_name, last_name, metadata);

		return response.status(200).json({newEntity});
	} catch (error) {
		logger.log("error", "Error creating new entity:", error);
		return response.status(500).json({error: "Failed to create new entity"});
	}
};

//this works
const getEntity = async (request: Request, response: Response) => {
	const id: string = request.params.id;
	const requestedEntity: any = (await method.entities.get(id)) || null;

	logger.log("info", "Requested entity: ", JSON.stringify(requestedEntity));

	return response.status(200).json({
		entity: requestedEntity,
	});
};

const getAvailableCapabilities = async (
	request: Request,
	response: Response
) => {
	const id: string = request.params.id;
	const requestedEntity: IEntity | null =
		(await method.entities.get(id)) || null;

	logger.log("info", "Requested entity: ", requestedEntity);

	// Check if the entity exists and has available capabilities
	if (requestedEntity && requestedEntity.available_capabilities) {
		return response.status(200).json({
			available_capabilities: requestedEntity.available_capabilities,
		});
	} else {
		// Handle the case where the entity does not exist or does not have available capabilities
		return response.status(404).json({
			message: "Entity not found or no available capabilities",
		});
	}
};

export default {
	getEntity,
	postEntity,
	testWithMethod,
	getAvailableCapabilities,
};
