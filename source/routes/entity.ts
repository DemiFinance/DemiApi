import express from "express";
import entityController from "../controllers/method/entity";
import {
	addDaysInAdvanceToMetadata,
	getDaysInAdvanceByEntityId,
} from "../controllers/auth0functions";
import jwtCheck from "../middleware/auth0";

const router = express.Router();

router.post("/", entityController.postEntity);
router.get("/:id", jwtCheck, entityController.getEntity);
router.get("/:id/days-in-advance", jwtCheck, getDaysInAdvanceByEntityId);
router.post("/:id/days-in-advance", jwtCheck, addDaysInAdvanceToMetadata);
router.get(
	"/:id/getAvailableCapabilities",
	jwtCheck,
	entityController.getAvailableCapabilities
);

export = router;
