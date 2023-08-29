import express from "express";
import paymentController from "../controllers/method/payment";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
	issuerBaseURL: "https://dev-0u7isllacvzlfhww.us.auth0.com/",
	tokenSigningAlg: "RS256",
});

router.post("/", jwtCheck, paymentController.sendPayment);
router.get(
	"/byDestination/:id",
	jwtCheck,
	paymentController.getPaymentsByDestination
);
router.get(
	"/bySourceHolder/:id",
	jwtCheck,
	paymentController.getPaymentsBySourceHolder
);
router.get(
	"/upcomingbyholder/:id",
	jwtCheck,
	paymentController.getUpcomingByHolder
);

export = router;
