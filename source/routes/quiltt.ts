import express from "express";
import {handleGenerateSessionToken} from "../controllers/quiltt";
import jwtCheck from "../middleware/auth0";

const router = express.Router();

const pong = async (request: express.Request, response: express.Response) => {
	return response.status(200).json({
		message: "pong",
	});
};

router.get("/ping", pong);
router.post("/sessionToken", jwtCheck, handleGenerateSessionToken);
router.post("/gettoken", jwtCheck, handleGenerateSessionToken);

export = router;
