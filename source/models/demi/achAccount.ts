export interface DemiAchAccount {
	method_accountID?: string;
	quiltt_accountId?: string;
	quiltt_userId?: string;
	method_entityId?: string;
	account_type?: string;
	account_name?: string;
	balance_available: number;
	balance_current: number;
	iso_currency_code?: string;
	created_at?: Date;
	updated_at?: Date;
}
