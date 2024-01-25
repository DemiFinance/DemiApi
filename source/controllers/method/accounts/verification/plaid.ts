import logger from "../../../../wrappers/winstonLogging";
import {method} from "../../../../wrappers/methodWrapper";
import {PlaidAccount, PlaidTransaction} from "../../../../models/quiltt/plaid";

export async function createPlaidVerification(
	accountId: string,
	accountDetails: PlaidAccount,
	accountTransactions: PlaidTransaction[]
) {
	const verification = await method.accounts(accountId).verification.create({
		type: "plaid",
		plaid: {
			balances: {
				available: accountDetails.balances.available,
				current: accountDetails.balances.current,
				isoCurrencyCode: accountDetails.balances.isoCurrencyCode,
				limit: accountDetails.balances.limit,
				unofficialCurrencyCode: accountDetails.balances.unofficialCurrencyCode,
			},
			transactions: accountTransactions,
		},
	});
	logger.info(`Created Plaid Verification for Account ID: ${accountId}`);
	logger.debug(`Verification: ${JSON.stringify(verification)}`);
}
