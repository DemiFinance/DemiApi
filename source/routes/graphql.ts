import express from "express";
import client from "../utilities/graphqlClient";
import schema from "../utilities/graphqlSchema";

import {validateApiKey} from "../middleware/apikey";

const router = express.Router();

router.post(
	"/graphqltest",
	validateApiKey,
	async (request: express.Request, response: express.Response) => {
		try {
			const result = await client.query({query: schema});
			return response.status(200).json(result);
		} catch (error) {
			return response.status(500).json({error: error});
		}
	}
);

export = router;
