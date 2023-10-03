import express from "express";
import paymentController from "../controllers/method/payment";
import jwtCheck from "../middleware/auth0";

const router = express.Router();

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
