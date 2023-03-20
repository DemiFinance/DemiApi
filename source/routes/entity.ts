import express from "express";
import entityController from "../controllers/method/entity";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
    issuerBaseURL: "https://dev-0u7isllacvzlfhww.us.auth0.com/",
	tokenSigningAlg: "RS256",
});

router.post("/", jwtCheck, entityController.postEntity);
router.get("/:id", jwtCheck, entityController.getEntity);

export = router;
