import express from "express";
import accountController from "../controllers/method/account";

import {jwtCheck} from "../globals";

const router = express.Router();

router.get("/:id", jwtCheck, accountController.getAccountById);
router.get("/:id", jwtCheck, accountController.listAccountsByHolder); // maybe move this to entity route?
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

export = router;
