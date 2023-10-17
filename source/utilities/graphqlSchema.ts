import {gql} from "graphql-tag";

export const AccountsSchema = gql`
	query SpendingAccountsWithTransactionsQuery($accountId: ID!) {
		account(id: $accountId) {
			sources {
				... on MxAccount {
					accountNumber
					apr
					apy
					availableBalance
					availableCredit
					balance
					cashBalance
					cashSurrenderValue
					createdAt
					creditLimit
					currencyCode
					dayPaymentIsDue
					deathBenefit
					guid
					holdingsValue
					insuredName
					institutionCode
					interestRate
					isClosed
					lastPayment
					lastPaymentAt
					loanAmount
					maturesOn
					memberGuid
					minimumBalance
					minimumPayment
					name
					originalBalance
					paymentDueAt
					payoffBalance
					payOutAmount
					premiumAmount
					startedOn
					subtype
					totalAccountValue
					type
					updatedAt
					userGuid
				}
			}
		}
	}
`;

export const TransactionsSchema = gql`
	query TransactionsByAccountId($accountId: ID!) {
		account(id: $accountId) {
			transactions {
				source(type: MX) {
					... on MxTransaction {
						accountGuid
						amount
						category
						checkNumberString
						createdAt
						currencyCode
						date
						description
						guid
						isBillPay
						isDirectDeposit
						isExpense
						isFee
						isIncome
						isInternational
						isOverdraftFee
						isPayrollAdvance
						latitude
						longitude
						memberGuid
						memo
						merchantCategoryCode
						merchantGuid
						originalDescription
						postedAt
						status
						topLevelCategory
						transactedAt
						type
						updatedAt
						userGuid
					}
				}
			}
		}
	}
`;
