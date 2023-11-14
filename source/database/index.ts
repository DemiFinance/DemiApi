import {Pool} from "pg";
import {QueryParams} from "../models/queryParams";
import logger from "../wrappers/winstonLogging";

const pool = new Pool();

export const query = async (queryParams: QueryParams) => {
	const start = Date.now();
	const res = queryParams.values
		? await pool.query(queryParams.text, queryParams.values)
		: await pool.query(queryParams.text);
	const duration = Date.now() - start;
	logger.info(
		`Query: ${queryParams.desc}, Duration: ${duration}, Rows: ${res.rowCount}`
	);
	return res;
};

export const getClient = () => {
	return pool.connect();
};
