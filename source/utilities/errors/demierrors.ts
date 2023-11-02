export class Auth0_Metadata_Search_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0 Metadata Search Error";
	}
}

export class Quiltt_Token_EnvVar_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Quiltt Token Error";
	}
}

export class Quiltt_SessionToken_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Quiltt Token Error";
	}
}

export class Phone_Number_Not_Found extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Phone number not found in auth0 profile!";
	}
}
export class Phone_Number_Bad_Format extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Phone number not e164 formatted!";
	}
}
