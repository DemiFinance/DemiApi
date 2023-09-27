import {gql} from "graphql-tag";

// Define your GraphQL schema here. This is just a placeholder and should be replaced with the actual schema for the Quiltt.io API.
const schema = gql`
	type User {
		id: ID!
		name: String!
		email: String!
	}

	type Post {
		id: ID!
		title: String!
		content: String!
		author: User!
	}

	type Query {
		users: [User]
		posts: [Post]
	}
`;

export default schema;
