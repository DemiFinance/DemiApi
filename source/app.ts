import * as dotenv from "dotenv";
dotenv.config();

import {startAPI} from "./server";

const cassandra = require("cassandra-driver");

//Need to read more docs on connection
const client = new cassandra.Client({
	//db node ip's
	contactPoints: ["0.0.0.0", "0.0.0.0"],
	localDataCenter: "datacenter1",
});

startAPI();
