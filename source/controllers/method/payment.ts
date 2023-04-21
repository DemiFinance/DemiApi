import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {Method, Environments, IAccountListOpts} from "method-node";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.sandbox,
});

const sendPayment = async (request: Request, response: Response) => {
	const payment = await method.payments.create({
		amount: request.body.amount,
		source: request.body.sourceAccount,
		destination: request.body.destinationAccount,
		description: "Demi Finance Payment",
	});

	return response.status(200).json({
		"Populate me?": "Maybe someday",
	});
};

export default {sendPayment};
