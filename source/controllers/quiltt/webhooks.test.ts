import {normalizeAccountType} from "./webhooks";

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
