import express from "express";

import {validateApiKey} from "../middleware/apikey";
import {webhookHandler} from "../controllers/webhooks";
import client from "../utilities/graphqlClient";
import schema from "../utilities/graphqlSchema";

const router = express.Router();

const pong = async (request: express.Request, response: express.Response) => {
	return response.status(200).json({
		message: "pong",
	});
};

router.get("/ping", validateApiKey, pong);
router.post("/", validateApiKey, webhookHandler);

router.post("/graphqltest", validateApiKey, async (request: express.Request, response: express.Response) => {
	try {
		const result = await client.query({ query: schema });
		return response.status(200).json(result);
	} catch (error) {
		return response.status(500).json({ error: error.toString() });
  }
});

export = router;
