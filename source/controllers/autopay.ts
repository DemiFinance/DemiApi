import { get } from "http";
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
		const {
			source_holder_id,
			destination_holder_id,
			frequency,
			start_date,
			end_date,
		} = request.body;
		// code to schedule a new auto payment

		console.log("source_holder_id: " + source_holder_id);
		console.log("destination_holder_id: " + destination_holder_id);
		console.log("frequency: " + frequency);
		console.log("start_date: " + start_date);
		console.log("end_date: " + end_date);

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

async function CreateAutoPayment() {
	// code to create a new auto payment
	console.log("Creating a new auto payment");
}

async function getAutoPayments() {
	// code to get all auto payments
	console.log("Getting all auto payments");
}

async function GetAutoPayment(id: string) {
	// code to get a specific auto payment
	console.log("Getting auto payment with id: " + id);

}

async function UpdateAutoPayment(id: string) {
	// code to update a specific auto payment
	console.log("Updating auto payment with id: " + id);
}

async function DeleteAutoPayment(id: string) {
	// code to delete a specific auto payment
	console.log("Deleting auto payment with id: " + id);
}

export default {
	ScheduleNewAutoPayment,
	newAutoPayment,
};
