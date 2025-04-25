import dotenv from 'dotenv'; 
import { devLogger } from './logger-dev.js';
import { prodLogger } from './logger-prod.js';

dotenv.config();

export const addLogger = (req, res, next) => {
    const environment = process.env.NODE_ENV || 'development';
    const logger = environment === 'production' ? prodLogger : devLogger;
    
    req.logger = {
        ...logger,
        warn: logger.warning,
    };
    
    next();
};
