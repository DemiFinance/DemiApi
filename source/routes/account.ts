import express from "express";
import accountController from "../controllers/method/account";

const router = express.Router();

router.get("/account/:id", accountController.getAccountById);
router.get("/accounts/:id", accountController.listAccountsByHolder);

export = router;
