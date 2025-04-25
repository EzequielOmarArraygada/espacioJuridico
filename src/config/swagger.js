import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ymir Store',
            version: '1.0.0',
            description: 'Documentación de la API para los módulos de productos, carrito, usuarios y sesiones.',
        },
        servers: [
            {
                url: 'ymir.up.railway.app', 
            },
        ],
    },
    apis: ['./src/routes/*.js'], 
};

const specs = swaggerJsdoc(options);

export default (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
