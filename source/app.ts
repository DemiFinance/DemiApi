require('dotenv').config();
import { startAPI } from "./server";
import { Method, Environments } from 'method-node'


const method = new Method({
    apiKey: process.env.METHOD_API_KEY!,
    env: Environments.dev,
});

const cassandra = require('cassandra-driver');

//Need to read more docs on connection
const client = new cassandra.Client({
    //db node ip's
    contactPoints: ['0.0.0.0', '0.0.0.0'],
    localDataCenter: 'datacenter1'
});

startAPI();
