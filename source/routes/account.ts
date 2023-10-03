import express from "express";
import accountController from "../controllers/method/account";

import {validateApiKey} from "../middleware/apikey";
import jwtCheck from "../middleware/auth0";

const router = express.Router();

router.get("/:id", jwtCheck, accountController.getAccountById);
router.get("/list/:id", jwtCheck, accountController.listAccountsByHolder); // maybe move this to entity route?
router.post("/creditScore", jwtCheck, accountController.getCreditScore);
router.post("/", jwtCheck, accountController.createACHAccount);
router.post(
	"/verification/:account_id",
	jwtCheck,
	accountController.createACHVerification
);
router.post(
	"/updateVerification/:account_id",
	jwtCheck,
	accountController.updateMicroDepositVerification
);
router.post(
	"/updateAccountName/",
	jwtCheck,
	accountController.updateAccountName
);
router.post("/newConnection", jwtCheck, accountController.processNewConnection);

router.post(
	"/forceMigration",
	validateApiKey,
	accountController.pushAccountstoDB
);

export = router;
