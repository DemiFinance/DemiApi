import express from "express";
import {getDaysInAdvanceByEntityId} from "../controllers/auth0functions";

import jwtCheck from "../middleware/auth0";

const router = express.Router();

router.get("/getDaysInAdvance", jwtCheck, getDaysInAdvanceByEntityId);

export = router;
