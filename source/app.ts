import * as dotenv from "dotenv";
dotenv.config();

import {startAPI} from "./server";
import {Method, Environments} from "method-node";

const method = new Method({
	apiKey: process.env.METHOD_API_KEY!,
	env: Environments.dev,
});

startAPI();
