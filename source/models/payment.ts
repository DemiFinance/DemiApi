// To parse this data:
//
//   import { Convert, PaymentList } from "./file";
//
//   const paymentList = Convert.toPaymentList(json);

export interface PaymentList {
    data: Payment[];
}

export interface Payment {
    id:                          string;
    source:                      string;
    destination:                 string;
    amount:                      number;
    description:                 string;
    status:                      string;
    estimated_completion_date:   Date;
    source_trace_id:             string;
    source_settlement_date:      Date;
    source_status:               string;
    destination_trace_id:        null | string;
    destination_settlement_date: Date;
    destination_status:          string;
    reversal_id:                 null;
    fee:                         Fee | null;
    type:                        string;
    error:                       null;
    metadata:                    null;
    created_at:                  Date;
    updated_at:                  Date;
}

export interface Fee {
    amount: number;
    type:   string;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toPaymentList(json: string): PaymentList {
        return JSON.parse(json);
    }

    public static paymentListToJson(value: PaymentList): string {
        return JSON.stringify(value);
    }
}
