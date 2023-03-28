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

//const verifyAchAccount = async (request: Request, response: Response) => {};

export default {getAccountById, listAccountsByHolder};
