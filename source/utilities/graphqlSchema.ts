import {gql} from "graphql-tag";

// Define your GraphQL schema here. This is just a placeholder and should be replaced with the actual schema for the Quiltt.io API.
const schema = gql`
	query getAccount($id: ID!) {
		account(id: $id) {
			id
			name
			type
			liability {
				id
				type
				creditCard {
					id
					issuer
					number
					creditLimit
					availableCredit
					paymentDueDate
					paymentDueAmount
					minimumPaymentDue
					transactions {
						id
						amount
						date
						description
						category
					}
				}
			}
		}
	}
`;

export default schema;
