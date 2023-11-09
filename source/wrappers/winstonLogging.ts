import * as dotenv from "dotenv";
dotenv.config();
const {createLogger, format} = require("winston");
const DatadogWinston = require("datadog-winston");

const logger = createLogger({
	level: "info",
	exitOnError: false,
	format: format.json(),
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
