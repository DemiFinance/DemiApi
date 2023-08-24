import {Request, Response} from "express";
import {WebhookObject} from "../models/webhook";

import {Method, Environments} from "method-node";
import * as db from "../database/index.js";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

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

	//check who owns the payment

	//check if owner opts in to notifications

	//begin notification process
	//if shit hits the fan
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

async function createAccount(id: string) {
	console.log(`Created account with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create account');
}

async function updateAccount(id: string) {
	console.log(`Updated account with id: ${id}`);

	/**
	 * 1. check database for exisiting account reccord
	 * 2. update the row with current information
	 * 3. pull from statement history table to see if there is a new due date.
	 * 4. push off to account service to handle the update
	 *
	 *  const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
	 *
	 */

	const account = await method.accounts.get(id);

	if (account.type == "liability") {
		if (account.liability?.type == "credit_card") {
			const accountData = {
				text: `INSERT INTO Account (id, holder_id, status, type, clearing, capabilities, available_capabilities, error, metaaccount, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
				ON CONFLICT (id)
				DO UPDATE SET
					holder_id = EXCLUDED.holder_id,
					status = EXCLUDED.status,
					type = EXCLUDED.type,
					clearing = EXCLUDED.clearing,
					capabilities = EXCLUDED.capabilities,
					available_capabilities = EXCLUDED.available_capabilities,
					error = EXCLUDED.error,
					metadata = EXCLUDED.metadata,
					created_at = EXCLUDED.created_at,
					updated_at = EXCLUDED.updated_at;
				`,
				values: [
					account.id,
					account.holder_id,
					account.status,
					account.type,
					account.clearing,
					account.capabilities,
					account.available_capabilities,
					account.error,
					account.metadata,
					account.created_at,
					account.updated_at,
				],
			};

			const result1 = await db.query(accountData);

			const liabilityData = {
				text: `INSERT INTO Liability (id, mch_id, mask, type, payment_status, data_status, data_sync_type, data_last_successful_sync, data_source, data_updated_at, ownership, data_status_error, hash)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
				ON CONFLICT (id)
				DO UPDATE SET
					mch_id = EXCLUDED.mch_id,
					mask = EXCLUDED.mask,
					type = EXCLUDED.type,
					payment_status = EXCLUDED.payment_status,
					data_status = EXCLUDED.data_status,
					data_sync_type = EXCLUDED.data_sync_type,
					data_last_successful_sync = EXCLUDED.data_last_successful_sync,
					data_source = EXCLUDED.data_source,
					data_updated_at = EXCLUDED.data_updated_at,
					ownership = EXCLUDED.ownership,
					data_status_error = EXCLUDED.data_status_error,
					hash = EXCLUDED.hash;`,
				values: [
					account.id,
					account.liability.mch_id,
					account.liability.mask,
					account.liability.type,
					account.liability.payment_status,
					account.liability.data_status,
					account.liability.data_sync_type,
					account.liability.data_last_successful_sync,
					account.liability.data_source,
					account.liability.data_updated_at,
					account.liability.ownership,
					account.liability.data_status_error,
					account.liability.hash,
				],
			};

			const result2 = await db.query(liabilityData);
			const cc = account.liability?.credit_card;
			const creditCardData = {
				text: `INSERT INTO Liability (id, mch_id, mask, type, payment_status, data_status, data_sync_type, data_last_successful_sync, data_source, data_updated_at, ownership, data_status_error, hash)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
				ON CONFLICT (id)
				DO UPDATE SET
					mch_id = EXCLUDED.mch_id,
					mask = EXCLUDED.mask,
					type = EXCLUDED.type,
					payment_status = EXCLUDED.payment_status,
					data_status = EXCLUDED.data_status,
					data_sync_type = EXCLUDED.data_sync_type,
					data_last_successful_sync = EXCLUDED.data_last_successful_sync,
					data_source = EXCLUDED.data_source,
					data_updated_at = EXCLUDED.data_updated_at,
					ownership = EXCLUDED.ownership,
					data_status_error = EXCLUDED.data_status_error,
					hash = EXCLUDED.hash;`,
				values: [
					account.id,
					cc?.name,
					cc?.balance,
					cc?.opened_at,
					cc?.last_payment_date,
					cc?.last_payment_amount,
					cc?.next_payment_due_date,
					cc?.next_payment_minimum_amount,
					cc?.last_statement_balance,
					cc?.remaining_statement_balance,
					cc?.available_credit,
					cc?.interest_rate_percentage,
					cc?.interest_rate_type,
					cc?.interest_rate_source,
					cc?.past_due_status,
					cc?.past_due_balance,
					cc?.past_due_date,
					cc?.auto_pay_status,
					cc?.auto_pay_amount,
					cc?.auto_pay_date,
					cc?.sub_type,
					cc?.term_length,
					cc?.closed_at,
					cc?.credit_limit,
					cc?.pending_purchase_authorization_amount,
					cc?.pending_credit_authorization_amount,
					cc?.interest_saving_balance,
					cc?.next_statement_date,
					// cc?.delinquent_status,
					// cc?.delinquent_amount,
					// cc?.delinquent_period,
					// cc?.delinquent_action,
					// cc?.delinquent_start_date,
					// cc?.delinquent_major_start_date,
					// cc?.delinquent_status_updated_at,
				],
			};

			const result3 = await db.query(creditCardData);

			const insertStatementSQL = {
				text: `
					WITH latest_update AS (
						SELECT EXTRACT(MONTH FROM captured_at) AS month, 
							   EXTRACT(YEAR FROM captured_at) AS year
						FROM AccountStatementHistory
						WHERE account_id = $1
						ORDER BY captured_at DESC
						LIMIT 1
					)
					INSERT INTO AccountStatementHistory (account_id, statement_balance, statement_due_date, minimum_payment)
					SELECT $1, $2, $3, $4
					WHERE NOT EXISTS (
						SELECT 1
						FROM latest_update
						WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
						AND year = EXTRACT(YEAR FROM CURRENT_DATE)
					);
				`,
				values: [
					account.id,
					account.liability.credit_card?.last_statement_balance,
					account.liability.credit_card?.next_payment_due_date,
					account.liability.credit_card?.last_statement_balance,
				],
			};

			const result4 = await db.query(insertStatementSQL);

			db.getClient().then((client) => {
				client.release();
			});

			console.log(
				"database ops complte: " + result1 + result2 + result3 + result4
			);

			//grab info then push to db

			//do the comparison thing
		}
	}
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update account');
}

async function createAccountVerification(id: string) {
	console.log(`Created account verification with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create account verification');
}

async function updateAccountVerification(id: string) {
	console.log(`Updated account verification with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update account verification');
}

async function createConnection(id: string) {
	console.log(`Created connection with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create connection');
}

async function updateConnection(id: string) {
	console.log(`Updated connection with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update connection');
}

async function createPaymentReversal(id: string) {
	console.log(`Created payment reversal with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to create payment reversal');
}

async function updatePaymentReversal(id: string) {
	console.log(`Updated payment reversal with id: ${id}`);
	// Add your logic here
	// If something goes wrong, throw an error
	// throw new Error('Failed to update payment reversal');
}

// Map operations to functions
const operationHandlers: {[key: string]: (id: string) => Promise<void>} = {
	"payment.create": createPayment,
	"payment.update": updatePayment,
	"entity.create": createEntity,
	"entity.update": updateEntity,
	"account.create": createAccount,
	"account.update": updateAccount,
	"account_verification.create": createAccountVerification,
	"account_verification.update": updateAccountVerification,
	"connection.create": createConnection,
	"connection.update": updateConnection,
	"payment_reversal.create": createPaymentReversal,
	"payment_reversal.update": updatePaymentReversal,
};

async function processWebhookObject(webhookObject: WebhookObject) {
	const handler = operationHandlers[webhookObject.type];
	if (handler) {
		await handler(webhookObject.id);
	} else {
		throw new Error(`No handler found for operation: ${webhookObject.op}`);
	}
}

export const webhookHandler = async (request: Request, response: Response) => {
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
