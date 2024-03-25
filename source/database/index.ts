import {Pool} from "pg";
import {QueryParams} from "../models/queryParams";
import logger from "../wrappers/winstonLogging";
import tracer from "../wrappers/datadogTracer";

const pool = new Pool();

export const query = async (queryParams: QueryParams) => {
	const start = Date.now();
	const span = tracer.startSpan("Database Query");
	try {
		const res = queryParams.values
			? await pool.query(queryParams.text, queryParams.values)
			: await pool.query(queryParams.text);
		const duration = Date.now() - start;
		logger.info(
			"Query: " +
				queryParams.desc +
				", Duration: " +
				duration +
				", Rows: " +
				res.rowCount
		);
		return res;
	} catch (error) {
		span.setTag("error", true);
		span.log({event: "error", message: error});
		throw error;
	} finally {
		span.finish();
	}
};

export const getClient = () => {
	return pool.connect();
};
