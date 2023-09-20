import express from "express";
import entityController from "../controllers/method/entity";
import {
	addDaysInAdvanceToMetadata,
	getDaysInAdvanceByEntityId,
} from "../controllers/auth0functions";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
	issuerBaseURL: "https://dev-0u7isllacvzlfhww.us.auth0.com/",
	tokenSigningAlg: "RS256",
});

router.post("/", entityController.postEntity);
router.get("/:id", jwtCheck, entityController.getEntity);
router.get("/:id/days-in-advance", jwtCheck, getDaysInAdvanceByEntityId);
router.post("/:id/days-in-advance", jwtCheck, addDaysInAdvanceToMetadata);

export = router;
