import { Address } from "./address"

export interface Entity {
    type: string,
    individual: Individual
    address?: Address
}

export interface Individual {
    id?: string
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    dob: string | null;
    ssn?: string;
}


export interface corporation {
    
}