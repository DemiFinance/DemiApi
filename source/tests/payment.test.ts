import { Convert, PaymentList, Payment } from "../models/payment";
import { expect } from "chai";
describe("PaymentList model", () => {
  it("should convert JSON to PaymentList", () => {
	const json = "{\"success\": true, \"data\": [], \"message\": null}";
	const paymentList = Convert.toPaymentList(json);
	expect(paymentList).to.be.an.instanceof(PaymentList);
	expect(paymentList.success).to.be.true;
	expect(paymentList.data).to.be.an("array");
	expect(paymentList.message).to.be.null;
  });
  // Add more tests as needed
});
describe("Payment model", () => {
  it("should have the correct properties", () => {
	const payment = new Payment();
	expect(payment).to.have.property("id");
	expect(payment).to.have.property("source");
	expect(payment).to.have.property("destination");
  });
    // Add more tests as needed
  });
// Removed extra closing parenthesis
