import {QueryParams} from "../models/queryParams";

export function generateAccountSQL(account: any): QueryParams {
	return {
		text: `INSERT INTO Account (id, holder_id, status, type, clearing, capabilities, available_capabilities, error, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id)
        DO UPDATE SET
            holder_id = EXCLUDED.holder_id,
            status = EXCLUDED.status,
            type = EXCLUDED.type,
            clearing = EXCLUDED.clearing,
            capabilities = EXCLUDED.capabilities,
            available_capabilities = EXCLUDED.available_capabilities,
            error = EXCLUDED.error,
            metadata = EXCLUDED.metadata,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at;
        `,
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
	};
}

export function generateLiabilitySQL(account: any): QueryParams {
	return {
		text: `INSERT INTO Liability (id, mch_id, mask, type, payment_status, data_status, data_sync_type, data_last_successful_sync, data_source, data_updated_at, ownership, data_status_error, hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id)
        DO UPDATE SET
            mch_id = EXCLUDED.mch_id,
            mask = EXCLUDED.mask,
            type = EXCLUDED.type,
            payment_status = EXCLUDED.payment_status,
            data_status = EXCLUDED.data_status,
            data_sync_type = EXCLUDED.data_sync_type,
            data_last_successful_sync = EXCLUDED.data_last_successful_sync,
            data_source = EXCLUDED.data_source,
            data_updated_at = EXCLUDED.data_updated_at,
            ownership = EXCLUDED.ownership,
            data_status_error = EXCLUDED.data_status_error,
            hash = EXCLUDED.hash;`,
		values: [
			account.id,
			account.liability.mch_id,
			account.liability.mask,
			account.liability.type,
			account.liability.payment_status,
			account.liability.data_status,
			account.liability.data_sync_type,
			account.liability.data_last_successful_sync,
			account.liability.data_source,
			account.liability.data_updated_at,
			account.liability.ownership,
			account.liability.data_status_error,
			account.liability.hash,
		],
	};
}

export function generateCreditCardSQL(account: any): QueryParams {
	const cc = account.liability?.credit_card;
	return {
		text: `INSERT INTO CreditCard 
        (id, name, balance, opened_at, last_payment_date, last_payment_amount, next_payment_due_date, next_payment_minimum_amount, last_statement_balance, remaining_statement_balance, available_credit, interest_rate_percentage, interest_rate_type, interest_rate_source, past_due_status, past_due_balance, past_due_date, auto_pay_status, auto_pay_amount, auto_pay_date, sub_type, term_length, closed_at, credit_limit, pending_purchase_authorization_amount, pending_credit_authorization_amount, interest_saving_balance, next_statement_date) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        ON CONFLICT (id)
        DO UPDATE SET 
            name = EXCLUDED.name,
            balance = EXCLUDED.balance,
            opened_at = EXCLUDED.opened_at,
            last_payment_date = EXCLUDED.last_payment_date,
            last_payment_amount = EXCLUDED.last_payment_amount,
            next_payment_due_date = EXCLUDED.next_payment_due_date,
            next_payment_minimum_amount = EXCLUDED.next_payment_minimum_amount,
            last_statement_balance = EXCLUDED.last_statement_balance,
            remaining_statement_balance = EXCLUDED.remaining_statement_balance,
            available_credit = EXCLUDED.available_credit,
            interest_rate_percentage = EXCLUDED.interest_rate_percentage,
            interest_rate_type = EXCLUDED.interest_rate_type,
            interest_rate_source = EXCLUDED.interest_rate_source,
            past_due_status = EXCLUDED.past_due_status,
            past_due_balance = EXCLUDED.past_due_balance,
            past_due_date = EXCLUDED.past_due_date,
            auto_pay_status = EXCLUDED.auto_pay_status,
            auto_pay_amount = EXCLUDED.auto_pay_amount,
            auto_pay_date = EXCLUDED.auto_pay_date,
            sub_type = EXCLUDED.sub_type,
            term_length = EXCLUDED.term_length,
            closed_at = EXCLUDED.closed_at,
            credit_limit = EXCLUDED.credit_limit,
            pending_purchase_authorization_amount = EXCLUDED.pending_purchase_authorization_amount,
            pending_credit_authorization_amount = EXCLUDED.pending_credit_authorization_amount,
            interest_saving_balance = EXCLUDED.interest_saving_balance,
            next_statement_date = EXCLUDED.next_statement_date;
        `,
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
	};
}

export function generateStatementSQL(account: any): QueryParams {
	return {
		text: `
        WITH latest_update AS (
            SELECT EXTRACT(MONTH FROM captured_at) AS month, 
                   EXTRACT(YEAR FROM captured_at) AS year
            FROM AccountStatementHistory
            WHERE account_id = $1
            ORDER BY captured_at DESC
            LIMIT 1
        )
        INSERT INTO AccountStatementHistory (account_id, statement_balance, statement_due_date, minimum_payment)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (
            SELECT 1
            FROM latest_update
            WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
            AND year = EXTRACT(YEAR FROM CURRENT_DATE)
        );
    `,
		values: [
			account.id,
			account.liability.credit_card?.last_statement_balance,
			account.liability.credit_card?.next_payment_due_date,
			account.liability.credit_card?.last_statement_balance,
		],
	};
}

export function generatePaymentNotifiedSQL(accountId: string): QueryParams {
	return {
		text: `
            SELECT 
                payment_notified
            FROM 
                AccountStatementHistory
            WHERE 
                account_id = $1
            AND 
                captured_at = (
                    SELECT 
                        MAX(captured_at) 
                    FROM 
                        AccountStatementHistory 
                    WHERE 
                        account_id = $1
                );
        `,
		values: [accountId],
	};
}