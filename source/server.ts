require('dotenv').config();
import * as dotenv from 'dotenv';
dotenv.config();

import http from "http";
import express, { Express } from "express";

const { auth } = require('express-oauth2-jwt-bearer')

import entityRoutes from "./routes/entity";
import authRoutes from "./routes/auth";
import accountRoutes from "./routes/account";


const jwtCheck = auth({
    audience: 'https://api.demifinance.com',
    issuerBaseURL: `https://dev-0u7isllacvzlfhww.us.auth0.com/`,
    tokenSigningAlg: 'RS256'
});

const router: Express = express();

router.use(express.urlencoded({ extended: false }));

router.use(express.json());

router.use((req, res, next) => {
    // set the CORS policy
    res.header('Access-Control-Allow-Origin', '*');
    // set the CORS headers
    res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
    // set the CORS method headers
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
        return res.status(200).json({});
    }
    next();
});

router.use(jwtCheck);

router.use('/', entityRoutes);
router.use('/', authRoutes);
router.use('/', accountRoutes);


router.use((req, res, next) => {
    const error = new Error('404 - Error not found!');
    return res.status(404).json({
        message: error.message
    });
});


const startAPI = async function () {
    
    const httpServer = http.createServer(router);
    const PORT: any = process.env.PORT!;
    
    httpServer.listen(PORT, () => console.log(`Nimbus API is running on port ${PORT}`));
    return "Server is servering";
}

export { startAPI };


