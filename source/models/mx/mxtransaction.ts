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

export type PlaidTransaction = {
	accountId: string;
	amount: number;
	isoCurrencyCode: string | null;
	unofficialCurrencyCode: string | null;
	category: string[];
	checkNumber: string | null;
	categoryId: string;
	date: string;
	location: {
		address: string | null;
		city: string | null;
		lat: number | null;
		lon: number | null;
		state: string | null;
		storeNumber: string | null;
		zip: string | null;
	};
	name: string;
	merchantName: string | null;
	originalDescription: string | null;
	paymentMeta: {
		referenceNumber: string | null;
		ppdId: string | null;
		payee: string | null;
		byOrderOf: string | null;
		payer: string | null;
		payment_method: string | null;
		payment_processor: string | null;
		reason: string | null;
	};
	pending: boolean;
	pendingTransactionId: string | null;
	accountOwner: string | null;
	transactionId: string;
	transactionType: string;
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
