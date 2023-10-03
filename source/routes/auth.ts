import express from "express";
import authController from "../controllers/method/auth";
import jwtCheck from "../middleware/auth0";

const router = express.Router();

router.post("/:id", jwtCheck, authController.newAuthSession);

export = router;
