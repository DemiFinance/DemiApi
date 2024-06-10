import logger from "../wrappers/winstonLogging";
import tracer from "dd-trace";
import axios, {AxiosResponse} from "axios";

const URI = "https://api.quiltt.io/v1/graphql";

export async function axiosGqlClient<T>(
	sessionToken: string,
	query: string,
	variables: {[key: string]: any}
): Promise<T> {
	const span = tracer.startSpan("axiosGqlClient");
	try {
		const gqlQuery = {query: query, variables: variables};
		logger.log("info", `GQL Query: ${JSON.stringify(gqlQuery)}`);
		const response: AxiosResponse<T> = await axios.post<T>(
			URI,
			JSON.stringify(gqlQuery),
			{
				headers: {
					Authorization: `Bearer ${sessionToken}`,
					"Content-Type": "application/json",
				},
			}
		);

		logger.log("info", `GQL Response: ${JSON.stringify(response.data)}`);

		return response.data;
	} catch (error) {
		logger.log("error", error);
		throw error; //TODO: Decide if we really want to rethrow this
	} finally {
		span.finish();
	}
}
