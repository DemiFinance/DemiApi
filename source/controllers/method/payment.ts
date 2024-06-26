import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {Method, Environments, IPaymentListOpts} from "method-node";
import * as db from "../../database/index";
import logger from "../../wrappers/winstonLogging";
import tracer from "../../wrappers/datadogTracer";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

const getPaymentsBySourceHolder = async (
	request: Request,
	response: Response
) => {
	try {
		logger.log(
			"info",
			"Attempting to get payments by sourceHolderId: " + request.params.id
		);
		const paymentOpts: IPaymentListOpts = {
			source_holder_id: request.params.id,
		};

		const payment = await method.payments.list(paymentOpts);
		logger.log("info", "[METHOD - Get Payment]" + JSON.stringify(payment));
		return response.status(200).json({
			payment: payment,
		});
	} catch (error) {
		logger.log("error", "[METHOD - Get Payment ERROR]" + error);
		return response.status(400).json({
			error: error,
		});
	}
};

const getPaymentsByDestination = async (
	request: Request,
	response: Response
) => {
	try {
		logger.log(
			"info",
			"Attempting to get payments by destinationid: " + request.params.id
		);
		const paymentOpts: IPaymentListOpts = {
			destination: request.params.id,
		};

		const payment = await method.payments.list(paymentOpts);
		logger.log("info", "[METHOD - Get Payment]" + JSON.stringify(payment));
		return response.status(200).json({
			payment: payment,
		});
	} catch (error) {
		logger.log("error", "[METHOD - Get Payment ERROR]" + error);
		return response.status(400).json({
			error: error,
		});
	}
};

const sendPayment = async (request: Request, response: Response) => {
	logger.log("info", "Attempting Payment...");
	try {
		logger.log(
			"info",
			"[PAYMENT] Amount: " +
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

		logger.info("[METHOD - New Payment]" + JSON.stringify(payment));
		return response.status(200).json({
			payment: [payment],
		});
	} catch (error) {
		logger.info("[METHOD - New Payment ERROR]" + error);
		return response.status(400).json({
			error: error,
		});
	}
};

//TODO: Update func to include payments due on the current date too
const getUpcomingByHolder = async (request: Request, response: Response) => {
	const span = tracer.startSpan("getUpcomingByHolder");
	try {
		logger.log(
			"info",
			"Attempting to get upcoming payments by holderId: " + request.params.id
		);
		const holderId = request.params.id;
		const queryString = {
			desc: "Get upcoming payments by holderId",
			text: `SELECT a.id AS account_id 
			FROM Account a 
			WHERE a.holder_id = $1 
			AND EXISTS (
				SELECT 1 
				FROM AccountStatementHistory ash 
				WHERE a.id = ash.account_id 
				AND ash.statement_due_date > CURRENT_DATE
			) 
			ORDER BY (SELECT MIN(ash.statement_due_date) 
			FROM AccountStatementHistory ash 
				WHERE a.id = ash.account_id 
				AND ash.statement_due_date > CURRENT_DATE
			) ASC;
    `,
			values: [holderId],
		};
		const accounts = await db.query(queryString);
		const accountIds = accounts.rows.map((account: any) => account.account_id);

		return response.status(200).json({
			accountIds,
		});
	} catch (error) {
		span.setTag("error", true);
		span.log({"error.message": error});
		logger.log("error", "[Get Upcoming Payments ERROR]" + error);
		return response.status(400).json({
			error: error,
		});
	} finally {
		span.finish();
	}
};

export default {
	sendPayment,
	getPaymentsByDestination,
	getPaymentsBySourceHolder,
	getUpcomingByHolder,
};
