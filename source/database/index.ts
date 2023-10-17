import {Pool} from "pg";
import {QueryParams} from "../models/queryParams";

const pool = new Pool();

export const query = async (queryParams: QueryParams) => {
	const start = Date.now();
	const res = queryParams.values
		? await pool.query(queryParams.text, queryParams.values)
		: await pool.query(queryParams.text);
	const duration = Date.now() - start;
	console.log(
		`Query: ${queryParams.desc}, Duration: ${duration}, Rows: ${res.rowCount}`
	);

	return res;
};

export const getClient = () => {
	return pool.connect();
};
