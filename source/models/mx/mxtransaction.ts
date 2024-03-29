import {PlaidTransaction} from "../quiltt/plaid";

export type MxTransaction = {
	accountGuid: string;
	amount: number;
	category: string;
	checkNumberString: string | null;
	createdAt: string;
	currencyCode: string | null;
	date: string;
	description: string;
	guid: string;
	isBillPay: boolean;
	isDirectDeposit: boolean;
	isExpense: boolean;
	isFee: boolean;
	isIncome: boolean;
	isInternational: boolean | null;
	isOverdraftFee: boolean;
	isPayrollAdvance: boolean;
	latitude: string | null;
	longitude: string | null;
	memberGuid: string;
	memo: string | null;
	merchantCategoryCode: string | null;
	merchantGuid: string | null;
	originalDescription: string;
	postedAt: string;
	status: string;
	topLevelCategory: string;
	transactedAt: string;
	type: string;
	updatedAt: string;
	userGuid: string;
};

export type TransactionObject = {
	__typename: string;
	source: (MxTransaction | PlaidTransaction) & {__typename: string}; // Include __typename in the source object type
};

export type AccountObject = {
	__typename: string;
	transactions: TransactionObject[];
};

export type TransactionJSON = {
	account: AccountObject;
};
