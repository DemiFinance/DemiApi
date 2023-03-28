import express from "express";
import accountController from "../controllers/method/account";

import {jwtCheck} from "../globals";

const router = express.Router();

router.get("/:id", jwtCheck, accountController.getAccountById);
router.get("/:id", jwtCheck, accountController.listAccountsByHolder);

export = router;
