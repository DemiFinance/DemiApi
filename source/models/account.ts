export interface Account {
	id: string;
	holder_id: string;
	type: string; // Enum type likely to be defined
	ach: Ach | null;
	liability: Liability | null;
	clearing: any | null; // Define based on detailed structure in the documentation
	metadata: any | null; // Define based on detailed structure in the documentation
	status: string;
	capabilities: string[]; // Array of strings, exact values based on documentation
	error: any | null; // Define based on detailed structure in the documentation
	created_at: string; // Date in ISO 8601 format
	updated_at: string; // Date in ISO 8601 format
}

interface Ach {
	routing: string;
	number: string;
	type: string; // Enum type likely to be defined ('checking', 'savings', etc.)
}

interface Liability {
	mch_id: string;
	number: string;
	// Additional properties as defined in the documentation
}
