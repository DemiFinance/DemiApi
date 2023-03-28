import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";

import {method} from "../../globals";

const sendPayment = async (request: Request, response: Response) => {
	const payment = await method.payments.create({
		amount: 10,
		source: request.body.sourceAccount,
		destination: request.body.destinationAccount,
		description: request.body.description,
	});

	return response.status(200).json({
		"Populate me?": "Maybe someday",
	});
};

export default {sendPayment};
