export class Auth0_Metadata_Search_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0 Metadata Search Error";
	}
}

export class Auth0_Search_User_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0 Search User Error";
	}
}
export class Auth0_GetUserById_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0 Search User Error";
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

export class No_CreditCard_found extends Error {
	constructor(message: string) {
		super(message);
		this.name = "No Credit card found!";
	}
}

export class CreditCard_Name_missing extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Credit card has no name";
	}
}

export class CreditCard_Name_bad_format extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Credit card name is not a string!";
	}
}

export class CreditCard_No_Due_Date extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Credit card has no due date!";
	}
}

export class CreditCard_invalid_payment_date extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Credit card payment date is not a date!";
	}
}

export class UserID_Not_a_string extends Error {
	constructor(message: string) {
		super(message);
		this.name = "User ID is not a string!";
	}
}

export class User_body_invalid extends Error {
	constructor(message: string) {
		super(message);
		this.name = "User body is invalid!";
	}
}
