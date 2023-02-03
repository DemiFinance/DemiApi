import {Request, response, Response} from "express";
import axios, { AxiosResponse } from "axios";

import { Entity , Individual} from "../../models/entity"
import { Address } from "../../models/address"

import { Method, Environments } from 'method-node';

const method = new Method({
    apiKey: process.env.METHOD_DEVELOPEMENTKEY ?? '',
    env: Environments.dev
})

const tempAddy: Address = {
    line1: "485 Sandmere Place",
    city: "Oakvbille",
    state: "TX",
    zip: "90210"
}

const testPerson: Individual = {
    firstName: "John",
    lastName: "Smith",
    phone: "19056162504"
}


async function createEntity(){
    const testEnt = await method.entities.create({
        type: 'individual',
        individual: testPerson
    })
}


//TODO - Needs
/**
 * 1. create new entity
 * 1.1 Recieve name + phone number from App
 * 1.2 Push name + number to method
 * 1.3 retrieve created entity from method
 * 1.4 push entity information + user info to database
 * 1.5 return entity info to app?
 */

const postEntity = async (request: Request, response: Response) => {
    var rawNewEntity = request.body
    const newEntity = await method.entities.create({
        type: 'individual',
        individual: {
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            phone: request.body.phone
        }
    });
}

const getEntity = async (request: Request, response: Response) => {
    let id: string = request.params.id;
    let requestedEntity: any = await method.entities.get(id)!;
}

async function newEntity(person: Entity) {
    const newEntity = await method.entities.create({
        type: 'individual',
        individual: {
            first_name: person.individual.first_name,
            last_name: person.individual.last_name,
            phone: person.individual.phone
        }
    });



    return response.status(200).json({
        message: "TODO",
        cat: newEntity
    })

}


export default { newEntity, getEntity }; 
