import {gql} from "graphql-tag";

export const MxAccountDetailsByAccountId = gql`
	query SpendingAccountsWithTransactionsQuery($accountId: ID!) {
		account(id: $accountId) {
			remoteData {
				mx {
					account {
						response {
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
		}
	}
`;

export const MxTransactionsByAccountId = gql`
	query MxTransactionsByAccountId($accountId: ID!) {
		account(id: $accountId) {
			transactions {
				remoteData {
					mx {
						transaction {
							response {
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
		}
	}
`;

export const MxGetAccountTypeByAccountId = gql`
	query MxGetAccountTypeByAccountId($accountId: ID!) {
		account(id: $accountId) {
			remoteData {
				mx {
					account {
						response {
							type
						}
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
				nodes {
					remoteData {
						plaid {
							transaction {
								response {
									accountId
									accountOwner
									amount
									isoCurrencyCode
									unofficialCurrencyCode
									category
									categoryId
									checkNumber
									counterparties {
										name
										type
										logoUrl
										website
									}
									date
									datetime
									authorizedDate
									authorizedDatetime
									location {
										address
										city
										region
										postalCode
										country
										lat
										lon
										storeNumber
									}
									name
									merchantName
									logoUrl
									website
									paymentMeta {
										byOrderOf
										payee
										payer
										paymentProcessor
										ppdId
										reason
										referenceNumber
									}
									paymentChannel
									pending
									pendingTransactionId
									personalFinanceCategory {
										detailed
										primary
									}
									personalFinanceCategoryIconUrl
									transactionId
									transactionCode
								}
							}
						}
					}
				}
			}
		}
	}
`;

export const PlaidAccountDetailsByAccountId = gql`
	query PlaidAccountDetailsByAccountId($accountId: ID!) {
		account(id: $accountId) {
			remoteData {
				plaid {
					account {
						response {
							balances {
								available
								current
								isoCurrencyCode
								limit
								unofficialCurrencyCode
							}
						}
					}
				}
			}
		}
	}
`;

export const MxHolderFromAccountId = gql`
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

export const GetAccountType = gql`
	query GetAccountType($accountId: ID!) {
		account(id: $accountId) {
			type
		}
	}
`;
