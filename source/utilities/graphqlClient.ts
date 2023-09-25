// Import necessary modules from Apollo Client
import { ApolloClient, InMemoryCache } from '@apollo/client';

// Define the Quiltt.io API URL
const QUILTT_API_URL = 'https://api.quiltt.io/graphql';

// Create a new instance of ApolloClient
const client = new ApolloClient({
  uri: QUILTT_API_URL,
  cache: new InMemoryCache(),
});

// Export the ApolloClient instance
export default client;
