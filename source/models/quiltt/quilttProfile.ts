export interface quilttProfile {
	id: string; // Profile ID
	uuid: string; // Profile UUID
	email: string | null; // Email associated with the Profile
	phone: string | null; // Phone number in E164 format
	name: string | null; // Common name or nickname for the Profile
	names: {
		full: string; // Full legal name
		first: string | null; // Legal given name
		last: string | null; // Legal surname
	} | null;
	dateOfBirth: string | null; // Date of birth in 'YYYY-MM-DD' format
	address: {
		line1: string;
		line2?: string; // Optional
		city: string;
		state: string;
		postalCode: number;
		countryCode: string;
	} | null;
	metadata: {[key: string]: any} | null; // Custom metadata, key-value format
	createdAt: string; // Creation date in ISO 8601 format
	updatedAt: string; // Last update date in ISO 8601 format
}
