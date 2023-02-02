import { startAPI } from "./server";
import { Method, Environments } from 'method-node'

const method = new Method({
    apiKey: process.env.METHODKEY_DEVELOPMENT ?? '',
    env: Environments.dev,
});

startAPI();
