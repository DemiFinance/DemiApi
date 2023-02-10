import * as dotenv from 'dotenv';
dotenv.config();
import {Request, response, Response} from "express";
import axios, { AxiosResponse } from "axios";

import { Entity , Individual} from "../../models/entity"
import { Address } from "../../models/address"

import { Method, Environments } from 'method-node';

const method = new Method({
    apiKey: process.env.METHOD_DEVELOPEMENTKEY!,
    env: Environments.dev
})


//working
const newAuthSession = async (request: Request, response: Response) => {
    let id: string = request.params.id;

    const token = await method.elements.createToken({
        entity_id: id,
        team_name: 'Demi Finance',
        type: 'auth',
        auth: {},
    });

    return response.status(200).json({
        element_token: token.element_token
    })
}


export default { newAuthSession };