import {normalizeAccountType, quilttOperationHandlers} from "./webhooks";

describe("normalizeAccountType", () => {
	it("should return 'checking' when given 'CHECKING'", () => {
		const result = normalizeAccountType("CHECKING");
		expect(result).toBe("checking");
	});

	it("should return 'savings' when given 'SAVINGS'", () => {
		const result = normalizeAccountType("SAVINGS");
		expect(result).toBe("savings");
	});

	it("should throw an error when given an invalid account type", () => {
		expect(() => normalizeAccountType("invalid")).toThrowError(
			"Invalid account type: invalid"
		);
	});
});

describe("quilttOperationHandlers", () => {
	it("'payment.created' defined", () => {
		expect(quilttOperationHandlers["profile.created"]).toBeDefined();
	});

	it("'payment.updated' defined", () => {
		expect(quilttOperationHandlers["profile.updated"]).toBeDefined();
	});

	it("'profile.deleted' defined", () => {
		expect(quilttOperationHandlers["profile.deleted"]).toBeDefined();
	});

	it("'entity.update' defined", () => {
		expect(quilttOperationHandlers["connection.created"]).toBeDefined();
	});

	it("'connection.updated' defined", () => {
		expect(quilttOperationHandlers["connection.updated"]).toBeDefined();
	});

	it("'connection.deleted' defined", () => {
		expect(quilttOperationHandlers["connection.deleted"]).toBeDefined();
	});

	it("'connection.synced.successful' defined", () => {
		expect(
			quilttOperationHandlers["connection.synced.successful"]
		).toBeDefined();
	});

	it("'connection.synced.successful.historical' defined", () => {
		expect(
			quilttOperationHandlers["connection.synced.successful.historical"]
		).toBeDefined();
	});

	it("'connection.synced.errored.repairable' defined", () => {
		expect(
			quilttOperationHandlers["connection.synced.errored.repairable"]
		).toBeDefined();
	});

	it("'connection.synced.errored.service' defined", () => {
		expect(
			quilttOperationHandlers["connection.synced.errored.service"]
		).toBeDefined();
	});

	it("'connection.synced.errored.provider' defined", () => {
		expect(
			quilttOperationHandlers["connection.synced.errored.provider"]
		).toBeDefined();
	});

	it("'connection.synced.errored.institution' defined", () => {
		expect(
			quilttOperationHandlers["connection.synced.errored.institution"]
		).toBeDefined();
	});

	it("'connection.disconnected' defined", () => {
		expect(quilttOperationHandlers["connection.disconnected"]).toBeDefined();
	});

	it("'account.created' defined", () => {
		expect(quilttOperationHandlers["account.created"]).toBeDefined();
	});

	it("'account.updated' defined", () => {
		expect(quilttOperationHandlers["account.updated"]).toBeDefined();
	});

	it("'account.deleted' defined", () => {
		expect(quilttOperationHandlers["account.deleted"]).toBeDefined();
	});

	it("'balance.created' defined", () => {
		expect(quilttOperationHandlers["balance.created"]).toBeDefined();
	});
});
