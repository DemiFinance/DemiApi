import * as dotenv from "dotenv";
// import { transports } from "winston";
dotenv.config();
const {createLogger /** format*/} = require("winston");
const DatadogWinston = require("datadog-winston");

const logger = createLogger({
	level: "info",
	exitOnError: false,
	// format: format.json(),
	//  transports: [
	// 	new transports.Console({
	// 		format: format.combine(format.colorize(), format.simple()),
	// 	}),
	// 	new transports.File({
	// 		filename: "demiLogs.log",
	// 	}),
	// ],
});

logger.add(
	new DatadogWinston({
		apiKey: process.env.DD_API_KEY,
		hostname: process.env.DATADOG_HOSTNAME,
		service: process.env.DD_SERVICE,
		ddsource: "nodejs",
	})
);

export default logger;
