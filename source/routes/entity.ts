import express from "express";
import entityController from "../controllers/method/entity";

const router = express.Router();

router.post("/entity", jwtCheck, entityController.postEntity);
router.get("/entity/:id", jwtCheck, entityController.getEntity);

export = router;
