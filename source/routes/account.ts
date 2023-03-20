import express from "express";
import accountController from "../controllers/method/account";

const router = express.Router();
const {auth} = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
	audience: "https://api.demifinance.com",
    issuerBaseURL: "https://dev-0u7isllacvzlfhww.us.auth0.com/",
	tokenSigningAlg: "RS256",
});

router.get("/:id", jwtCheck, accountController.getAccountById);
router.get("/:id", jwtCheck, accountController.listAccountsByHolder);

export = router;
