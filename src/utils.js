import bcrypt from 'bcrypt';
import passport from 'passport';

const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));
const isValidatePassword = (lawer, password) => bcrypt.compareSync(password, lawer.password);

const requirePremium = (req, res, next) => {
    if (req.session.role !== 'premium' && req.session.role !== 'admin') {
        req.logger.warning(`Acceso denegado: Solo usuarios premium o admin. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
        return res.status(403).send('Acceso denegado: Solo usuarios premium o admin');
    }
    next();
};

const requireOwnershipOrAdmin = async (req, res, next) => {
    const { pid } = req.params;
    const lawer = req.lawer;

    try {
        const product = await productManager .getProduct(pid);

        if (!product) {
            req.logger.warning(`Producto no encontrado. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
            return res.status(404).send('Producto no encontrado');
        }

        if (product.owner.toString() !== lawer._id && lawer.role !== 'admin') {
            req.logger.warning(`Acceso denegado: No tienes permiso para esta acción. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
            return res.status(403).send('Acceso denegado: No tienes permiso para esta acción');
        }
        next();
    } catch (error) {
        req.logger.error(`Error al verificar el dueño del producto: ${error.message}. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
        res.status(500).send('Error interno del servidor');
    }
};

const passportCall = (strategy, role) => {
    return (req, res, next) => {
        // Rutas públicas con acceso opcional al usuario autenticado
        const publicPaths = [
            { path: '/products', method: 'GET' },
            { path: '/about', method: 'GET' },
            { path: '/contactus', method: 'GET' },
            { path: '/faq', method: 'GET' },
            { path: '/gallery', method: 'GET' }
        ];

        const isPublicPath = publicPaths.some(p =>
            req.path.startsWith(p.path) && req.method === p.method
        );

        if (isPublicPath) {
            passport.authenticate(strategy, { session: false }, (err, lawer, info) => {
                if (err) return next(err);
                if (lawer) req.lawer = lawer;
                return next();
            })(req, res, next);
        } else {
            // Rutas protegidas
            passport.authenticate(strategy, function (err, lawer, info) {
                if (err) return next(err);
                if (!lawer) return res.redirect('/login');

                req.logger?.info(`Usuario autenticado: ${lawer.email}`);
                req.logger?.debug(`Rol de usuario: ${lawer.role}`);

                if (lawer.role !== role && lawer.role !== 'admin') {
                    req.logger?.warning(`Acceso denegado. Rol incorrecto: ${lawer.role}`);
                    return res.status(403).send({ error: `Acceso denegado. Rol de usuario incorrecto.` });
                }

                req.lawer = lawer;
                next();
            })(req, res, next);
        }
    };
};



export default { createHash, isValidatePassword, passportCall, requirePremium, requireOwnershipOrAdmin };
