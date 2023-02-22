import * as dotenv from 'dotenv';
dotenv.config();
import { Request, Response} from "express";
import { Method, Environments, IAccountListOpts } from 'method-node';

const method = new Method({
    apiKey: process.env.METHOD_API_KEY!,
    env: Environments.dev
})

async function tesinting() {
    const urmom = method.accounts.list();
}


//complete
const getAccountById = async (request: Request, response: Response) => {


    let account: any = await method.accounts.get(request.params.id);


    return response.status(200).json({
        account: account
    })
}

//complete
const listAccountsByHolder = async (request: Request, response: Response) => {

    let opts: IAccountListOpts = {
        holder_id: request.params.id
    };
    
    let accountList: any = await method.accounts.list(opts)!;

    console.log("Accounts" + accountList);

    return response.status(200).json({
       accounts: accountList
    });
    
}

export default { getAccountById, listAccountsByHolder}