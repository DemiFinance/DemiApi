import {Request, response, Response} from "express";
import axios, {AxiosResponse} from "axios";

import {updateUserMeta, getToken} from "./auth0functions";
import {log} from "console";
import {WebhookObject} from "../models/webhook";

async function createPayment(id: string) {
	console.log(`Payment with id: ${id} has created`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create payment');
}

async function updatePayment(id: string) {
	console.log(`Payment with id: ${id} has updated`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update payment');
}

async function createEntity(id: string) {
	console.log(`Created entity with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create entity');
}

async function updateEntity(id: string) {
	console.log(`Updated entity with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update entity');
}

// Map operations to functions
const operationHandlers: {[key: string]: (id: string) => Promise<void>} = {
	"payment.create": createPayment,
	"payment.update": updatePayment,
	"entity.create": createEntity,
	"entity.update": updateEntity,
	// Add more operations as needed
};

async function processWebhookObject(webhookObject: WebhookObject) {
	const handler = operationHandlers[webhookObject.op];
	if (handler) {
		await handler(webhookObject.id);
	} else {
		throw new Error(`No handler found for operation: ${webhookObject.op}`);
	}
}

export const mainHandler = async (request: Request, response: Response) => {
	console.log("webhook received" + JSON.stringify(request.body));
	try {
		const webhook: WebhookObject = {
			id: request.body.id,
			type: request.body.type,
			op: request.body.op,
		};

		await processWebhookObject(webhook);
	} catch (error) {
		console.log("error in webhook" + error);
		return response.status(500).json({
			message: "Error processing webhook",
			error: error,
		});
	}
	return response.status(200).json({
		message: "webhook received",
	});
};
