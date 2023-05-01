import {log} from "console";
import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {
	Method,
	Environments,
	IAccountListOpts,
	IACHCreateOpts,
} from "method-node";

import {changeAccountName, getToken} from "../auth0functions";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.sandbox,
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

	const accountList: any = await method.accounts.list(opts)!;

	console.log("Recieved GET - /accounts/list/" + request.params.id);

	return response.status(200).json({accounts: accountList});
};

const createACHAccount = async (request: Request, response: Response) => {
	const opts: IACHCreateOpts = {
		holder_id: request.body.id,
		ach: {
			routing: request.body.routing_number,
			number: request.body.account_number,
			type: request.body.type,
		},
	};

	const newAccount: any = await method.accounts.create(opts);

	return response.status(200).json({
		account: newAccount,
	});
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
		const verification: any = await method
			.accounts(request.params.account_id)
			.update({
				micro_deposits: {
					amounts: [request.body.amount1, request.body.amount2],
				},
			});

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
	const name = request.body.name;

	try {
		const userId = request.body.auth0_id;
		const accountName = request.body.accountName;
		const accountId = request.body.accountId;

		const token = await getToken();
		try {
			changeAccountName(
				token,
				userId,
				accountName,
				accountId
			);
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

export default {
	getAccountById,
	listAccountsByHolder,
	createACHAccount,
	createACHVerification,
	updateMicroDepositVerification,
	getCreditScore,
	updateAccountName,
};
