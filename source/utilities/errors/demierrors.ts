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
