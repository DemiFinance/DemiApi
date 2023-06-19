import {log} from "console";
import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {Method, Environments, IAccountListOpts} from "method-node";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.production,
});

const sendPayment = async (request: Request, response: Response) => {
	console.log("Attempting Payment...");
	try {
		console.log(
			"[PAYMENT] Amount: " +
				request.body.amount +
				" Source: " +
				request.body.sourceAccount +
				" Destination: " +
				request.body.destinationAccount
		);

		const payment = await method.payments.create({
			amount: request.body.amount,
			source: request.body.sourceAccount,
			destination: request.body.destinationAccount,
			description: "DEMI PYMNT",
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
