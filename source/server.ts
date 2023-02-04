import http from "http";
import express, { Express } from "express";

import entityRoutes from "./routes/entity"
import authRoutes from "./routes/auth"

import dotenv from "dotenv"

const router: Express = express();

require('dotenv').config();

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

router.use('/', entityRoutes);
router.use('/', authRoutes);

router.use((req, res, next) => {
    const error = new Error('404 - Error not found!');
    return res.status(404).json({
        message: error.message
    });
});


const startAPI = async function () {
    
    const httpServer = http.createServer(router);
    const PORT: any = process.env.PORT ?? 8080;
    console.log(process.env);
    
    httpServer.listen(PORT, () => console.log(`Nimbus API is running on port ${PORT}`));
    return "Server is servering";
}

export { startAPI };


