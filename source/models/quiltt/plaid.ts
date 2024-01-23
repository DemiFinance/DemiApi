export type PlaidTransactions = {
	transactions: PlaidTransaction[];
};

export type PlaidAccount = {
    accountId: string;
    balances: {
        available: number;
        current: number;
        isoCurrencyCode: string;
        limit: number;
        unofficialCurrencyCode: string;
    }
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
