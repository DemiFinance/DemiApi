/**
 * Represents an identity object in the user data.
 * @typedef {Object} Identity
 * @property {string} user_id - The user ID for the identity.
 * @property {string} provider - The provider for the identity.
 * @property {string} connection - The connection for the identity.
 * @property {boolean} isSocial - Indicates if the identity is social.
 */
export interface Identity {
	user_id: string;
	provider: string;
	connection: string;
	isSocial: boolean;
}

/**
 * Represents app metadata in the user data.
 * @typedef {Object} AppMetadata
 * @property {string} entity_id - The entity ID for the app metadata.
 * @property {string} notificationToken - The notification token for the app metadata.
 * @property {number} daysInAdvance - The number of days in advance for notifications.
 * @property {string} quiltt_account_id - The Quiltt account ID for the app metadata.
 * @property {string} quiltt_uuid - The Quiltt UUID for the app metadata.
 */
export interface AppMetadata {
	entity_id: string;
	notificationToken: string;
	daysInAdvance: number;
	quiltt_account_id: string;
	quiltt_uuid: string;
}

/**
 * Represents a user object based on the Auth0 data model.
 * @typedef {Object} User
 * @property {string} created_at - The creation timestamp for the user.
 * @property {Identity[]} identities - An array of identities for the user.
 * @property {string} name - The name of the user.
 * @property {string} phone_number - The phone number of the user.
 * @property {boolean} phone_verified - Indicates if the phone number is verified.
 * @property {string} picture - The URL of the user's picture.
 * @property {string} updated_at - The update timestamp for the user.
 * @property {string} user_id - The user ID for the user.
 * @property {Object} user_metadata - The user metadata.
 * @property {AppMetadata} app_metadata - The app metadata.
 * @property {string} family_name - The family name of the user.
 * @property {string} given_name - The given name of the user.
 * @property {string} last_ip - The last IP address used by the user.
 * @property {string} last_login - The last login timestamp for the user.
 * @property {number} logins_count - The count of logins by the user.
 * @property {string[]} blocked_for - An array of identifiers for which the user is blocked.
 * @property {Object[]} guardian_authenticators - An array of guardian authenticators for the user.
 * @property {Object[]} passkeys - An array of passkeys for the user.
 */
export interface User {
	created_at: string;
	identities: Identity[];
	name: string;
	phone_number: string;
	phone_verified: boolean;
	picture: string;
	updated_at: string;
	user_id: string;
	user_metadata: Record<string, unknown>;
	app_metadata: AppMetadata;
	family_name: string;
	given_name: string;
	last_ip: string;
	last_login: string;
	logins_count: number;
	blocked_for: string[];
	guardian_authenticators: object;
	passkeys: object;
}

export type LuceneQuery = string;
