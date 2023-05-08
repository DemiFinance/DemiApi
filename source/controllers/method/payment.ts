import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {Method, Environments, IAccountListOpts} from "method-node";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.production,
});

const sendPayment = async (request: Request, response: Response) => {
	try {
		const payment = await method.payments.create({
			amount: request.body.amount,
			source: request.body.sourceAccount,
			destination: request.body.destinationAccount,
			description: "Demi Finance Payment",
		});

		console.log("[METHOD - New Payment]" + JSON.stringify(payment));
		return response.status(200).json({
			payment,
		});
	} catch (error) {
		console.log("[METHOD - New Payment ERROR]" + error);
		return response.status(400).json({
			error: error,
		});
	}
};

export default {sendPayment};
