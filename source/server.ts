import * as dotenv from "dotenv";
dotenv.config();

import http from "http";
import express, {Express} from "express";

import entityRoutes from "./routes/entity";
import authRoutes from "./routes/auth";
import accountRoutes from "./routes/account";
import paymentRoutes from "./routes/payment";
import notificationRoutes from "./routes/notifications";
import webhookRoutes from "./routes/webhooks";

const router: Express = express();

router.use(express.urlencoded({extended: false}));

router.use(express.json());

router.use((req, res, next) => {
	// set the CORS policy
	res.header("Access-Control-Allow-Origin", "*");
	// set the CORS headers
	res.header(
		"Access-Control-Allow-Headers",
		"origin, X-Requested-With,Content-Type,Accept, Authorization"
	);
	// set the CORS method headers
	if (req.method === "OPTIONS") {
		res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST");
		return res.status(200).json({});
	}
	next();
});

const path = require("path");

router.use("/assets", express.static(path.join(__dirname, "/public")));

//srouter.post("/test", entityController.testWithMethod);

router.use("/entity", entityRoutes);
router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);
router.use("/payment", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/webhook", webhookRoutes);

router.use((req, res) => {
	const error = new Error("404 - Error not found!");
	console.log("API Gateway - 404 " + req.originalUrl);
	return res.status(404).json({
		message: error.message,
	});
});

const startAPI = async function () {
	const httpServer = http.createServer(router);
	const PORT: any = process.env.PORT || "8080";

	httpServer.listen(PORT, () =>
		console.log(`Nimbus API is running on port ${PORT}`)
	);
	return "Server is servering";
};

export {startAPI};
