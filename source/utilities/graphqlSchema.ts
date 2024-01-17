import {gql} from "graphql-tag";

export const AccountDetailsByAccountId = gql`
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

//TODO: REFACTORY THIS QUERY TO USE THE NEW TRANSACTION MODEL
export const MxTransactionsByAccountId = gql`
	query MxTransactionsByAccountId($accountId: ID!) {
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

//TODO: REFACTORY THIS QUERY TO USE THE NEW TRANSACTION MODEL
export const PlaidTransactionsByAccountId = gql`
	query PlaidTransactionsByAccountId($accountId: ID!) {
		account(id: $accountId) {
			transactions {
				source(type: PLAID) {
					... on PlaidTransaction {
						accountId
						amount
						isoCurrencyCode
						unofficialCurrencyCode
						category
						checkNumber
						categoryId
						date
						location {
							address
							city
							lat
							lon
							state
							storeNumber
							zip
						}
						name
						merchantName
						originalDescription
						paymentMeta {
							referenceNumber
							ppdId
							payee
							byOrderOf
							payer
							paymentMethod
							paymentProcessor
							ppdId
							reason
							referenceNumber
							referenceNumber
							scheme
							statusCode
							statusDescription
						}
						pending
						pendingTransactionId
						pendingTransactionDate
						pendingTransactionAuthorizedDate
						pendingTransactionPaymentChannel
						pendingTransactionPaymentMeta {
							referenceNumber
							ppdId
							payee
							byOrderOf
							payer
							paymentMethod
							paymentProcessor
							ppdId
							reason
							referenceNumber
							referenceNumber
							scheme
							statusCode
							statusDescription
						}
						pendingTransactionPaymentProcessor
						pendingTransactionStatus
						pendingTransactionType
						pendingTransactionDescription
						pendingTransactionAmount
						transactionId
						transactionDate
						transactionAuthorizedDate
						transactionPaymentChannel
						transactionPaymentMeta {
							referenceNumber
							ppdId
							payee
							byOrderOf
							payer
							paymentMethod
							paymentProcessor
							ppdId
							reason
							referenceNumber
							referenceNumber
							scheme
							statusCode
							statusDescription
						}
						transactionPaymentProcessor
						transactionStatus
						transactionType
						transactionDescription
						transactionAmount
					}
				}
			}
		}
	}
`;

export const HolderFromAccountId = gql`
	query HolderFromAccountId($accountId: ID!) {
		account(id: $accountId) {
			sources {
				... on MxAccount {
					userId
				}
			}
		}
	}
`;

export const GetProfileId = gql`
	query GetProfileId {
		profile {
			id
			uuid
		}
	}
`;
