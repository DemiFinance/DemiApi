import logger from "../wrappers/winstonLogging";
import {Request, Response} from "express";

async function ScheduleNewAutoPayment() {
	// code to schedule a new auto payment
	console.log("Scheduling a new auto payment");
}

const newAutoPayment = async (request: Request, response: Response) => {
	logger.log("info", "Attempting to schedule a new auto payment...");
	try {

        //this is terrible, do more static assignment
        const {source_holder_id, destination_holder_id, frequency, start_date, end_date } = request.body;
        // code to schedule a new auto payment

		logger.log("info", "[AUTOPAY] Scheduling new auto payment...");
		await ScheduleNewAutoPayment();
		return response.status(200).json({
			message: "Auto payment scheduled successfully",
		});
	} catch (error) {
		logger.log(
			"error",
			"[AUTOPAY] Error scheduling new auto payment: " + error
		);
		return response.status(400).json({
			error: error,
		});
	}
};

export default {
	ScheduleNewAutoPayment,
	newAutoPayment,
};
