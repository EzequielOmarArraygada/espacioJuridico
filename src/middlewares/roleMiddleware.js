import lawer from '../dao/models/lawer.model.js';

export const requirePremium = async (req, res, next) => {
    const lawerId = req.lawerId; 
    const lawer = await lawer.findById(lawerId);
    if (lawer.role !== 'premium') {
        return res.status(403).send('Acceso denegado: se requiere rol premium');
    }
    next();
};