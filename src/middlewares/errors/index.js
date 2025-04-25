import EError from '../../services/errors/enums.js';

export default (error, req, res, next) => {
    req.logger.error(
        `Error recibido en ${req.method} ${req.url}: ${error.message} - ${new Date().toLocaleString()}`
    );

    switch (error.code) {
        case EError.INVALID_TYPES_ERROR:
            req.logger.error(
                `Error de tipos inválidos en ${req.method} ${req.url}: ${error.message} - ${new Date().toLocaleString()}`
            );
            res.status(400).json({ status: 'error', error: error.name, message: error.message });
            break;

        default:
            req.logger.error(
                `Error no contemplado en ${req.method} ${req.url}: ${error.message} - ${new Date().toLocaleString()}`
            );
            res.status(500).json({ status: 'error', error: 'error no contemplado' });
            break;
    }
};

