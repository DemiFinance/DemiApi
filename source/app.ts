import * as dotenv from "dotenv";
dotenv.config();

import {startAPI} from "./server";
console.log("starting API...");
startAPI();
