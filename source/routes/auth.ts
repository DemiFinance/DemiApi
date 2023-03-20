import express from "express";

import authController from "../controllers/method/auth";

const router = express.Router();

router.post("/auth/:id", jwtCheck, authController.newAuthSession);

export = router;
