import {Pool} from "pg";

const pool = new Pool();

type QueryParams = {
	text: string;
	values?: any[];
};

export const query = async ({text, values}: QueryParams) => {
	const start = Date.now();
	const res = values ? await pool.query(text, values) : await pool.query(text);
	const duration = Date.now() - start;
	console.log("executed query", {text, duration, rows: res.rowCount});

	return res;
};

export const getClient = () => {
	return pool.connect();
};
