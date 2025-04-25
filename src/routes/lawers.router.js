import { Router } from 'express';
import passport from 'passport';
import { lawerController } from '../controllers/lawers.controller.js';
import { ViewsController } from '../controllers/views.controller.js'
import utils from '../utils.js';
import upload from '../middlewares/upload.js';

const { passportCall } = utils;
const lawersRouter = Router();
const {
    postSignup,
    postLogin,
    getSignOut,
    togglePremium,
    uploadDocuments,
    getAlllawers,
    deleteInactivelawers,
    requestPasswordReset,
    getPasswordReset,
    postPasswordReset,
    getProfile,
    updatelawer,
    requestPasswordResetFromLogin,
} = new lawerController();

const {
    renderLogin,
} = new ViewsController()

/**
 * @swagger
 * /api/sessions/signup:
 *   post:
 *     summary: Registro de un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               email: "test@example.com"
 *               password: "password"
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en el registro
 */
lawersRouter.post('/signup', passport.authenticate('signup', { 
    failureRedirect: '/login?error=El usuario ya existe', 
    failureMessage: true 
}), postSignup);

/**
 * @swagger
 * /api/sessions/login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               email: "test@example.com"
 *               password: "password"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales inválidas
 */
lawersRouter.post('/login', postLogin);

lawersRouter.get('/login', renderLogin);

/**
 * @swagger
 * /api/sessions/signout:
 *   get:
 *     summary: Cierra sesión de usuario
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: Usuario no autenticado
 */
lawersRouter.get('/signout', getSignOut);

/**
 * @swagger
 * /api/sessions/premium/{uid}:
 *   put:
 *     summary: Alterna el rol del usuario entre 'lawer' y 'premium'
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Rol del usuario cambiado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 */
lawersRouter.put('/premium/:uid', passportCall('login', 'lawer'), togglePremium);

/**
 * @swagger
 * /api/sessions/{uid}/documents:
 *   post:
 *     summary: Subir documentos del usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Documentos subidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Error al subir documentos
 *       401:
 *         description: Usuario no autenticado
 */
lawersRouter.post('/:uid/documents', passportCall('login', 'lawer'), upload.array('documents', 10), uploadDocuments);

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Obtiene todos los usuarios con sus datos principales
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                   correo:
 *                     type: string
 *                   rol:
 *                     type: string
 *       500:
 *         description: Error interno del servidor
 */
lawersRouter.get('/', getAlllawers);

/**
 * @swagger
 * /api/sessions:
 *   delete:
 *     summary: Elimina todos los usuarios que no hayan tenido conexión en los últimos días
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Usuarios inactivos eliminados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
lawersRouter.delete('/', deleteInactivelawers);

/**
 * @swagger
 * /api/sessions/password-reset-request:
 *   post:
 *     summary: Solicitud de restablecimiento de contraseña
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             example:
 *               email: "lawer@example.com"
 *     responses:
 *       200:
 *         description: Correo de restablecimiento de contraseña enviado exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */

lawersRouter.post('/password-reset-request', passportCall('login', 'lawer'), requestPasswordReset);

lawersRouter.post('/password-reset-login', requestPasswordResetFromLogin);


/**
 * @swagger
 * /api/sessions/reset-password:
 *   post:
 *     summary: Restablecer la contraseña del usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword: "newPassword123"
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Error al restablecer la contraseña
 *       500:
 *         description: Error interno del servidor
 */

lawersRouter.post('/password-reset', postPasswordReset);

lawersRouter.get('/reset-password', getPasswordReset);

lawersRouter.get('/profile/:uid', passportCall('login', 'lawer'), getProfile)

lawersRouter.put('/update/:uid', passportCall('login', 'lawer'), updatelawer)

export default lawersRouter;
