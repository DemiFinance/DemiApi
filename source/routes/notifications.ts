import express from "express";
import {
	addNotificationTokenToMetadata,
	getNotificationTokenByEntyityId,
	getDaysInAdvanceByEntityId,
} from "../controllers/auth0functions";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
	issuerBaseURL: "https://dev-0u7isllacvzlfhww.us.auth0.com/",
	tokenSigningAlg: "RS256",
});

router.post("/addToken", jwtCheck, addNotificationTokenToMetadata);
router.get("/:id", jwtCheck, getNotificationTokenByEntyityId);
router.get("/getDaysInAdvance", jwtCheck, getDaysInAdvanceByEntityId);

export = router;
