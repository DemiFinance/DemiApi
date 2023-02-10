import express from "express";

import paymentController from "../controllers/method/payment";

const router = express.Router();

router.post('/payment', paymentController.sendPayment);

export = router;