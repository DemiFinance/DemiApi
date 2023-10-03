import express from "express";
import {
	addNotificationTokenToMetadata,
	getNotificationTokenByEntyityId,
	getDaysInAdvanceByEntityId,
} from "../controllers/auth0functions";

import jwtCheck from "../middleware/auth0";

const router = express.Router();

router.post("/addToken", jwtCheck, addNotificationTokenToMetadata);
router.get("/:id", jwtCheck, getNotificationTokenByEntyityId);
router.get("/getDaysInAdvance", jwtCheck, getDaysInAdvanceByEntityId);

export = router;
