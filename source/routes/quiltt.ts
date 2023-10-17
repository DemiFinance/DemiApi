import express from "express";
import {handleGenerateSessionToken} from "../controllers/quiltt";
import jwtCheck from "../middleware/auth0";

const router = express.Router();

router.post("/sessionToken", jwtCheck, handleGenerateSessionToken);

export = router;
