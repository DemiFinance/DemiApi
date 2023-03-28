import express from "express";
import paymentController from "../controllers/method/payment";

import {jwtCheck} from "../globals";

const router = express.Router();

router.post("/payment", jwtCheck, paymentController.sendPayment);

export = router;
