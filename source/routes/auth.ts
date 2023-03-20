import express from "express";
import authController from "../controllers/method/auth";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
	issuerBaseURL: "https://auth.demifinance.com/",
	tokenSigningAlg: "RS256",
});

router.post("/:id", jwtCheck, authController.newAuthSession);

export = router;
