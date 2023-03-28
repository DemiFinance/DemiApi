import * as dotenv from "dotenv";
dotenv.config();
import {Request, Response} from "express";
import {IAccountListOpts, IACHCreateOpts} from "method-node";

import {method} from "../../globals";

//complete
const getAccountById = async (request: Request, response: Response) => {
	const account: any = await method.accounts.get(request.params.id);

	return response.status(200).json({
		account: account,
	});
};

//complete
const listAccountsByHolder = async (request: Request, response: Response) => {
	const opts: IAccountListOpts = {
		holder_id: request.params.id,
	};

	const accountList: any = await method.accounts.list(opts)!;

	console.log("Accounts" + accountList);

	return response.status(200).json({
		accounts: accountList,
	});
};

const createACHAccount = async (request: Request, response: Response) => {

	const opts: IACHCreateOpts = {
		holder_id: request.params.id,
		ach: {
			routing: request.body.routing_number,
			number: request.body.account_number,
			type: request.body.type,
		}
	};

	const newAccount: any = await method.accounts.create(opts);

	return response.status(200).json({
		account: newAccount,
	});
};

const createACHVerification = async (request: Request, response: Response) => {

	try {
		const verification: any = await method.accounts(request.params.account_id).verification.create({
			type: "micro_deposits",
		});
	
		return response.status(200).json({
			verification: verification,
		});
	}
	catch (error) {
		console.error("Error creating new verification:", error);
		return response.status(500).json({error: "Failed to create new verification"});
	}

};


const updateMicroDepositVerification = async (request: Request, response: Response) => {

	try {
		const verification: any = await method.accounts(request.params.account_id).update({
			micro_deposits: {
				amounts: [request.body.amount1, request.body.amount2],
			},
		});
	
		return response.status(200).json({
			verification: verification,
		});
	} catch (error) {
		console.error("Error updating micro deposit verification:", error);
		return response.status(500).json({error: "Failed to update micro deposit verification"});
	}
};

export default {getAccountById, listAccountsByHolder, createACHAccount, createACHVerification, updateMicroDepositVerification};
