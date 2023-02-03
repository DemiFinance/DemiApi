import express from "express"
import entityController from "../controllers/method/entity"

const router = express.Router();

router.post('/entity', entityController.newEntity);

export = router;