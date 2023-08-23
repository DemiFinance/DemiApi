import {Pool} from "pg";

const pool = new Pool();

export const query = async (text: string, params: [any: any]) => {
	const start = Date.now();
	const res = await pool.query(text, params);
	const duration = Date.now() - start;
	console.log("executed query", {text, duration, rows: res.rowCount});
	return res;
};

export const getClient = () => {
	return pool.connect();
};
