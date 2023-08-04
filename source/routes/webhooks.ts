import express from "express";

import {validateApiKey} from "../middleware/apikey";

const router = express.Router();

const pong = async (request: express.Request, response: express.Response) => {
	return response.status(200).json({
		message: "pong",
	});
};

router.get("/ping", validateApiKey, pong);
router.post("/", validateApiKey, pong)

export = router;
