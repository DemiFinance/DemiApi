import express from "express";
import authController from "../controllers/method/auth";

import {jwtCheck} from "../globals";

const router = express.Router();

router.post("/:id", jwtCheck, authController.newAuthSession);

export = router;
