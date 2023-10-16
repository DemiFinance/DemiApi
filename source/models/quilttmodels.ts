export interface QuilttEnvironment {
	id: string;
	name: string;
	mode: string;
	metadata: Record<string, unknown>; // Use Record<K, T> if the keys and value types are known
}

export interface QuilttWebhookObject {
	environment: QuilttEnvironment;
	eventTypes: Array<string>; // or string[]
	events: Array<QuilttEvent>; // or QuilttEvent[]
}

export interface NameDetails {
	full: string;
	first: string;
	last: string;
}

export interface Address {
	line1: string;
	line2: string;
	city: string;
	state: string;
	postalCode: string;
	countryCode: string;
}

export interface Profile {
	id: string;
	uuid: string;
	email: string;
	phone: string;
	name: string;
	names: NameDetails;
	dateOfBirth: string;
	address: Address;
	metadata: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export interface Connection {
	id: string;
	status: string;
	metadata: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export interface Account {
	id: string;
	connectionId: string;
	metadata: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export type RecordType = Profile | Connection | Account;

export interface QuilttEvent {
	id: string;
	type: string;
	profile?: Profile;
	record: RecordType;
}
