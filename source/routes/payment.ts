import express from "express";

import paymentController from "../controllers/method/payment";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
	issuerBaseURL: "https://auth.demifinance.com/",
	tokenSigningAlg: "RS256",
});

router.post("/payment", paymentController.sendPayment);

export = router;
