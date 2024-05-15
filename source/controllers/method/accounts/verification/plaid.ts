import logger from "../../../../wrappers/winstonLogging";
import {method} from "../../../../wrappers/methodWrapper";
import {Balances, PlaidTransaction} from "../../../../models/quiltt/plaid";

export async function createPlaidVerification(
	accountId: string,
	accountBalances: Balances,
	accountTransactions: PlaidTransaction[]
) {
	const verification = await method.accounts(accountId).verification.create({
		type: "plaid",
		plaid: {
			balances: {accountBalances},
			transactions: accountTransactions,
		},
	});
	logger.info(`Created Plaid Verification for Account ID: ${accountId}`);
	logger.debug(`Verification: ${JSON.stringify(verification)}`);

	return verification;
}
