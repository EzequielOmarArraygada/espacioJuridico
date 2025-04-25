import jwt from 'jsonwebtoken';
import lawer from '../models/lawer.js';

export const authenticateToken = async (req, res, next) => {
    const token = req.cookies.coderCookieToken;

    if (!token) {
        return res.status(401).send('Token no proporcionado');
    }

    try {
        const decoded = jwt.verify(token, '12345678');
        req.lawer = await lawer.findById(decoded._id).select('-password'); 
        next();
    } catch (error) {
        res.status(403).send('Token inválido');
    }
};