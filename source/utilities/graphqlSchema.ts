export const GetProfileId = `
	query GetProfileId {
		profile {
			id
			uuid
		}
	}
`;

export const GetAccountType = `
	query GetAccountType($accountId: ID!) {
		account(id: $accountId) {
			type
		}
	}
`;

//Built for new Axios queries
export const GetUsersCheckingandSavingsAccounts = `
	query GetUserCheckingAndSavingsAccounts {
		accounts(filter: { type: [SAVINGS, CHECKING]}) {
			id
			mask
			remoteData {
				plaid {
					account {
						response {
							mask
							balances {
								available
								current
								isoCurrencyCode
								limit
								lastUpdatedDateTime
								unofficialCurrencyCode
								limit
							}
						}
					}
				}
			}
		}
	}
`;
//built for axios...
export const PlaidAccountBalancesForMethodVerification = `
	query PlaidAccountBalancesForMethodVerification($accountId: ID!) {
		account(id: $accountId) {
			name
			mask
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

//built for axios braah
export const PlaidAccountTransactionsForMethodVerification = `
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
