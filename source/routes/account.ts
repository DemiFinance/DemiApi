import express from "express";
import accountController from "../controllers/method/account";

const router = express.Router();

router.get("/account/:id", jwtCheck, accountController.getAccountById);
router.get("/accounts/:id", jwtCheck,  accountController.listAccountsByHolder);

export = router;
