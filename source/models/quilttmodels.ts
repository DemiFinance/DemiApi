import {quilttProfile} from "./quiltt/quilttProfile";

export interface UnifiedWebhookObject {
	id?: string;
	type: string;
	op?: string;
	environment?: string;
	eventTypes?: string[];
	events?: Array<{type: string /* other fields */}>;
}
export interface AccountNumbers {
	accountId: string;
	number: string;
	routing: string;
}
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

export interface Balance {
	id: string;
	accountId: string;
	at: string;
	available: number;
	current: number;
	limit: number | null;
}

export type RecordType = Profile | Connection | Account | Balance;

export interface QuilttEvent {
	id: string;
	type: string;
	profile?: quilttProfile;
	record: RecordType;
}
