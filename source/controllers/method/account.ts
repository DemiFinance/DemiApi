import {log} from "console";
import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {Method, Environments, IAccountListOpts} from "method-node";

import {changeAccountName, getToken} from "../auth0functions";
import * as db from "../../database/index.js";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY || "",
	env: Environments.production,
});

//complete
const getAccountById = async (request: Request, response: Response) => {
	const account: any = await method.accounts.get(request.params.id);

	return response.status(200).json({account});
};

//complete
const listAccountsByHolder = async (request: Request, response: Response) => {
	const opts: IAccountListOpts = {
		holder_id: request.params.id,
	};

	const accountList: any = (await method.accounts.list(opts)) || null;

	console.log("Recieved GET - /accounts/list/" + request.params.id);

	return response.status(200).json({accounts: accountList});
};

const syncNewAccount = async (account: string) => {
	try {
		console.log("Syncing account: " + account);
		const newSync = await method.accounts(account).syncs.create();
		console.log("Sync response: " + JSON.stringify(newSync));
	} catch (error) {
		console.error(`Error while syncing account ${account}: ${error}`);
		throw new Error(`Failed to sync account ${account}`);
	}
};

const processNewConnection = async (request: Request, response: Response) => {
	try {
		const {connectionId} = request.body;
		log("Processing new connection " + JSON.stringify(request.body));

		response.status(200).json({success: true});

		const currentConnection = await method.connections.get(connectionId);

		if (
			!currentConnection ||
			!currentConnection.accounts ||
			!Array.isArray(currentConnection.accounts)
		) {
			throw new Error("Invalid connection or missing accounts");
		}

		for (const account of currentConnection.accounts) {
			if (typeof account !== "string") {
				throw new Error("Invalid account ID");
			}

			await syncNewAccount(account);
		}
	} catch (error) {
		console.error(`Error while processing request: ${error}`);
		return response.status(500).json({error: "Failed to sync new connection"});
	}
};

const createACHAccount = async (request: Request, response: Response) => {
	try {
		const account: any = await method.accounts.create({
			holder_id: request.body.id,
			ach: {
				routing: request.body.routing_number,
				number: request.body.account_number,
				type: request.body.type,
			},
		});

		const verification: any = await method
			.accounts(account.id)
			.verification.create({
				type: "micro_deposits",
			});

		// If you want to include the verification in the response, you can add it here
		return response.status(200).json({
			account: account,
			verification: verification,
		});
	} catch (error) {
		console.error("Error creating new account:", error);
		return response.status(500).json({error: "Failed to create new account"});
	}
};

const createACHVerification = async (request: Request, response: Response) => {
	try {
		const verification: any = await method
			.accounts(request.params.account_id)
			.verification.create({
				type: "micro_deposits",
			});

		return response.status(200).json({
			verification: verification,
		});
	} catch (error) {
		console.error("Error creating new verification:", error);
		return response
			.status(500)
			.json({error: "Failed to create new verification"});
	}
};

const updateMicroDepositVerification = async (
	request: Request,
	response: Response
) => {
	try {
		console.log(
			"Verifying micro deposits for account: " + request.params.account_id
		);

		const verification: any = await method
			.accounts(request.params.account_id)
			.verification.update({
				micro_deposits: {
					amounts: [request.body.amount1, request.body.amount2],
				},
			});
		console.log("Verification response: " + JSON.stringify(verification));
		return response.status(200).json({
			verification: verification,
		});
	} catch (error) {
		console.error("Error updating micro deposit verification:", error);
		return response
			.status(500)
			.json({error: "Failed to update micro deposit verification"});
	}
};

const getCreditScore = async (request: Request, response: Response) => {
	try {
		const creditScore: any = await method.entities.getCreditScore(
			request.body.entity_id
		);

		return response.status(200).json({
			creditScore: creditScore,
		});
	} catch (error) {
		console.error("Error getting credit score:", error);
		return response.status(500).json({error: "Failed to get credit score"});
	}
};

const updateAccountName = async (request: Request, response: Response) => {
	const account_id = request.params.account_id;

	try {
		const userId = request.body.auth0_id;
		const accountName = request.body.accountName;
		const accountId = request.body.accountId;

		const token = await getToken();
		try {
			changeAccountName(token, userId, accountName, accountId);
		} catch (error) {
			console.log("[UPDATE METADATA ERROR]" + error);
		}
		const account: any = await method.accounts(account_id).update({});

		return response.status(200).json({
			account: account,
		});
	} catch (error) {
		console.error("Error changing account name:", error);
		return response.status(500).json({error: "Failed to change account name"});
	}
};

const getFakeAccount = async (request: Request, response: Response) => {
	try {
		const accountList = {
			accounts: [],
		};
		return response.status(200).json({
			account: accountList,
		});
	} catch (error) {
		console.error("Error retrieving fake account:", error);
		return response
			.status(500)
			.json({error: "Failed to retrieve fake account"});
	}
};

const pushAccountstoDB = async (request: Request, response: Response) => {
	const insertOrUpdateAccount = `
    INSERT INTO Account (id, holder_id, status, type, clearing, capabilities, available_capabilities, error, metadata, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id)
    DO UPDATE SET updated_at = EXCLUDED.updated_at;
`;

	const insertOrUpdateLiability = `
    INSERT INTO Liability (id, mch_id, mask, type, payment_status, data_status, data_sync_type, data_last_successful_sync, data_source, data_updated_at, ownership, data_status_error, hash) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id)
    DO UPDATE SET data_updated_at = EXCLUDED.data_updated_at;
`;

	const insertOrUpdateCreditCard = `
    INSERT INTO CreditCard (id, name, balance, opened_at, last_payment_date, last_payment_amount, next_payment_due_date, next_payment_minimum_amount, last_statement_balance, remaining_statement_balance, available_credit, interest_rate_percentage, interest_rate_type, interest_rate_source, past_due_status, past_due_balance, past_due_date, auto_pay_status, auto_pay_amount, auto_pay_date, sub_type, term_length, closed_at, credit_limit, pending_purchase_authorization_amount, pending_credit_authorization_amount, interest_saving_balance, next_statement_date) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
    ON CONFLICT (id)
    DO UPDATE SET balance = EXCLUDED.balance;
`;
	//, delinquent_status, delinquent_amount, delinquent_period, delinquent_action, delinquent_start_date, delinquent_major_start_date, delinquent_status_updated_at
	//, $29, $30, $31, $32, $33, $34, $35

	try {
		// Begin the transaction
		await db.query({text: "BEGIN"});

		const accounts = await method.accounts.list();

		for (const account of accounts) {
			// Insert or update account
			await db.query({
				text: insertOrUpdateAccount,
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
			});

			// Insert or update liability
			await db.query({
				text: insertOrUpdateLiability,
				values: [
					account.id,
					account.liability?.mch_id,
					account.liability?.mask,
					account.liability?.type,
					account.liability?.payment_status,
					account.liability?.data_status,
					account.liability?.data_sync_type,
					account.liability?.data_last_successful_sync,
					account.liability?.data_source,
					account.liability?.data_updated_at,
					account.liability?.ownership,
					account.liability?.data_status_error,
					account.liability?.hash,
				],
			});

			// Insert or update credit card
			const cc = account.liability?.credit_card;
			await db.query({
				text: insertOrUpdateCreditCard,
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
				],
			});
		}

		// Commit the transaction
		await db.query({text: "COMMIT"});

		return response
			.status(200)
			.json({message: "Successfully pushed accounts to db"});
	} catch (error) {
		// Roll back in case of any errors
		await db.query({text: "ROLLBACK"});

		console.error("Error pushing accounts to db:", error);
		return response.status(500).json({error: "Failed to push accounts to db"});
	} finally {
		// Release the client
		const client = await db.getClient();
		client.release();
	}
};

export default {
	getAccountById,
	listAccountsByHolder,
	createACHAccount,
	createACHVerification,
	updateMicroDepositVerification,
	getCreditScore,
	updateAccountName,
	getFakeAccount,
	processNewConnection,
	pushAccountstoDB,
};
