export class Auth0_Metadata_Search_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0MetadataSearchError";
	}
}

export class Auth0_Search_User_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0SearchUserError";
	}
}
export class Auth0_No_User_Found_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0NoUserFoundError";
	}
}
export class Auth0_GetUserById_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Auth0SearchUserError";
	}
}
export class Quiltt_Token_EnvVar_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "QuilttTokenError";
	}
}

export class Quiltt_SessionToken_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "QuilttTokenError";
	}
}

export class Phone_Number_Not_Found extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PhoneNumberNotFound";
	}
}
export class Phone_Number_Bad_Format extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PhoneNumberBadFormat";
	}
}

export class No_CreditCard_found extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NoCreditCardFound";
	}
}

export class CreditCard_Name_missing extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CrreditCardMissingName";
	}
}

export class CreditCard_Name_bad_format extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CreditCardBadNameFormat";
	}
}

export class CreditCard_No_Due_Date extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CreditCardNoDueDate";
	}
}

export class CreditCard_invalid_payment_date extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CreditCardInvalidPaymentDate";
	}
}

export class UserID_Not_a_string extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UserIDNotAString";
	}
}

export class User_body_invalid extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UserBodyInvalid";
	}
}

export class Account_Numbers_Missing extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AccountNumbersMissing";
	}
}

export class Not_ACH_Account extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotACHAccount";
	}
}

export class Token_Refresh_Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TokenRefreshError";
	}
}
