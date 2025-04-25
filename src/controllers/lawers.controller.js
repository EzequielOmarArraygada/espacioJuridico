import { lawerManagerMongo } from '../dao/services/managers/lawerManagerMongo.js';
import jwt from 'jsonwebtoken';
import utils from '../utils.js';
import dotenv from 'dotenv';
import Lawer from '../dao/models/lawer.model.js';
import path from 'path';
import { sendPasswordResetEmail } from '../services/mailing.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../services/mailing.js';


dotenv.config();

export class lawerController {
    constructor() {
        this.lawersService = new lawerManagerMongo();
    }

    postSignup = async (req, res) => {
        res.redirect('/login');
    }

    postSignupDash = async (req, res) => {
        res.redirect('/admin/lawers?success=true');
    };
    
    postLogin = async (req, res) => {
        const { email, password } = req.body;
        try {
            const normalizedEmail = email.toLowerCase(); // Convertimos el email a minúsculas
            let lawer = await this.lawersService.findByEmail(normalizedEmail);
    
            if (!lawer) {
                req.logger.warn(`Intento de inicio de sesión con un usuario no existente: ${email}, ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
                req.logger.debug('Enviando respuesta de error: usuario no existe');
                return res.redirect('/login?error=Email no registrado');
            }
    
            req.session.clientId = lawer._id;
            req.session.role = lawer.role;
            req.logger.debug(`Usuario encontrado: ${lawer ? lawer.email : 'No encontrado'}, ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
    
            const isValid = utils.isValidatePassword(lawer, password);
            req.logger.debug(`Verificación de contraseña: ${isValid ? 'exitosa' : 'fallida'}, ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
    
            if (!isValid) {
                req.logger.warn(`Intento de inicio de sesión fallido para el usuario: ${email}, ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
                req.logger.debug('Redirigiendo a /faillogin');
                return res.redirect('/login?error=Contraseña incorrecta');
            }
    
            const tokenlawer = {
                _id: lawer._id,
                email: lawer.email,
                first_name: lawer.first_name,
                role: lawer.role,
                Cases: lawer.Cases,
            };
            lawer.last_connection = new Date();
            await lawer.save();
            const token = jwt.sign(tokenlawer, process.env.JWT_SECRET, { expiresIn: '1d' });
            req.logger.debug(`Token JWT generado exitosamente: ${token}, ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
    
            res.cookie('coderCookieToken', token, {
                maxAge: 60 * 60 * 1000 * 24,
                httpOnly: true,
            });
    
            req.logger.debug('Redirigiendo a /');
            return res.redirect('/');
        } catch (error) {
            req.logger.error(`Error al procesar el inicio de sesión: ${error.message}, ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`);
            req.logger.debug('Enviando respuesta de error del servidor');
            return res.status(500).send({ status: 'error', message: 'Error interno del servidor.' });
        }
    }


    getSignOut = async (req, res, next) => {
        try {
            req.logout((err) => {
                if (err) {
                    return next(err);
                }
                res.clearCookie('coderCookieToken').redirect('/login');
            });
        } catch (error) {
            console.error(`Error al cerrar sesión: ${error.message}`);
            res.status(500).send({ status: 'error', message: 'Error al cerrar sesión.' });
        }
    }

   
    uploadDocuments = async (req, res) => {
        try {
            const lawerId = req.params.uid;
            const lawer = await Lawer.findById(lawerId);
            if (!lawer) {
                return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ status: 'error', message: 'No se han subido documentos' });
            }

            req.files.forEach(file => {
                let folder;
                if (file.originalname === 'profile.jpg') {
                    folder = 'profiles';
                } else if (file.originalname === 'product.jpg') {
                    folder = 'products';
                } else {
                    folder = 'documents';
                }

                const fullPath = `/uploads/${folder}/${file.originalname}`;

                // Verifica si el documento ya está agregado
                if (!lawer.documents.some(doc => doc.reference === fullPath)) {
                    lawer.documents.push({
                        name: file.originalname,
                        reference: fullPath
                    });
                }
            });

            // Guarda el usuario con los documentos actualizados
            await lawer.save();

            res.status(200).json({ status: 'success', message: 'Documentos subidos exitosamente' });
        } catch (error) {
            console.error('Error al subir documentos:', error);
            res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
        }
    }

    

    togglePremium = async (req, res) => {
        try {
            const { uid } = req.params;
            const lawer = await this.lawersService.findById(uid);
    
            if (!lawer) {
                return res.status(404).send({ status: 'error', message: 'Usuario no encontrado' });
            }
    
            // Validar documentos antes de cambiar a premium
            const requiredDocsKeywords = ['Identificacion', 'Comprobante de domicilio', 'Comprobante de estado de cuenta'];
            const hasAllRequiredDocs = requiredDocsKeywords.every(keyword =>
                lawer.documents.some(doc => doc.name.includes(keyword))
            );
    
            if (!hasAllRequiredDocs && lawer.role !== 'premium') {
                return res.status(400).send({ status: 'error', message: 'Faltan documentos para cambiar a premium' });
            }
    
            lawer.role = lawer.role === 'premium' ? 'lawer' : 'premium';
            await lawer.save();
    
            res.send({ status: 'success', message: `El rol del usuario ha sido cambiado a ${lawer.role}` });
        } catch (error) {
            req.logger.error(
                `Error al cambiar el rol del usuario: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ status: 'error', message: 'Error interno del servidor.' });
        }
    }

    getAlllawers = async (req, res) => {
        try {
            const lawers = await this.lawersService.getAlllawers();
            res.status(200).json(lawers);
        } catch (error) {
            req.logger.error(`Error al obtener usuarios: ${error.message}`);
            res.status(500).send({ status: 'error', message: 'Error interno del servidor.' });
        }
    }

    getDashlawers = async (req, res) => {
        try {
            const result = await this.lawersService.getAlllawers();
            const lawers = result.map(lawer => ({
                _id: lawer._id,
                first_name: lawer.first_name,
                last_name: lawer.last_name,
                role: lawer.role,
                email: lawer.email,
                age: lawer.age,
                last_connection: lawer.last_connection,
            }));
            res.render('adminlawers', { lawers });
        } catch (error) {
            req.logger.error(`Error al obtener los usuarios: ${error.message}`);
            res.status(500).send({ error: 'Ocurrió un error al obtener los usuarios.' });
        }
    }  

    deleteInactivelawers = async (req, res) => {
        try {
            const result = await this.lawersService.deleteInactivelawers();
            res.status(200).json(result);
        } catch (error) {
            req.logger.error(`Error al eliminar usuarios inactivos: ${error.message}`);
            res.status(500).send({ status: 'error', message: 'Error interno del servidor.' });
        }
    }

    requestPasswordReset = async (req, res) => {
        const email  = req.lawer.email;
        try {
            const lawer = await this.lawersService.findByEmail(email);
            if (!lawer) {
                return res.status(404).send('Usuario no encontrado');
            }

            const token = jwt.sign({ lawerId: lawer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            sendPasswordResetEmail(lawer.email, token);
            res.send('Correo enviado');
        } catch (error) {
            res.status(500).send('Error interno del servidor');
        }
    }

    requestPasswordResetFromLogin = async (req, res) => {
        const { email } = req.body;
    
        if (!email) {
            return res.status(400).json({ message: 'El email es obligatorio' });
        }
    
        try {
            const lawer = await this.lawersService.findByEmail(email);
            if (!lawer) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
    
            const token = jwt.sign(
                { lawerId: lawer._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
    
            await sendPasswordResetEmail(lawer.email, token);
    
            return res.status(200).json({ message: 'Correo enviado' });
        } catch (error) {
            console.error("Error en requestPasswordResetFromEmail:", error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    };

    getPasswordReset = async (req, res) => {
        const { token } = req.query;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.render('resetPassword', { token });
        } catch (error) {
            res.status(400).send('El enlace ha expirado');
        }
    }

    postPasswordReset = async (req, res) => {
        const { token, newPassword } = req.body;
        try {
            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const lawer = await this.lawersService.findById(decoded.lawerId);
    
            if (!lawer) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
    
            if (await lawer.isPasswordSame(newPassword)) {
                return res.status(400).json({ success: false, message: 'La nueva contraseña no puede ser igual a la anterior' });
            }
    
            lawer.password = await lawer.hashPassword(newPassword);
            await lawer.save();
            
            return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error(`Error al restablecer la contraseña: ${error.message}`);
            return res.status(400).json({ success: false, message: 'Error al restablecer la contraseña' });
        }
    }
    

    isAdmin = async (req, res, next) => {
        if (req.lawer.role === 'admin') {
          return next();
        }
        res.redirect('/login');
      }

    addlawer = async (req, res, next) => {
        try {
            const { first_name, last_name, email, age, password, role } = req.body;
            const lawer = req.lawer; 

            if (lawer.role !== 'admin') {
                return res.status(403).send('Solo los usuarios admin pueden crear usuarios.');
            }

            const result = await this.lawersService.createOne({
                first_name,
                last_name,
                email,
                age,
                password: utils.createHash(password),
                role
            });

            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al agregar el producto: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Error interno del servidor.' });
        }
    }

     updatelawer = async (req, res, next) => {
        try {
             const { uid } = req.params;
             const updatedData = req.body;
             const result = await this.lawersService.updatelawer(uid, updatedData);
             res.send({ result: 'success', payload: result });
         } catch (error) {
             req.logger.error(`Error al actualizar el usuario ${error.message}`);
             res.status(500).send({ error: 'Error al actualizar el usuario.' });
         }
     };
    

     deletelawer = async (req, res) => {
         try {
             const { uid } = req.params;
             const lawerDeleted = await this.lawersService.findById(uid);
             const lawer = req.lawer; 

             if (!lawerDeleted) {
                 return res.status(404).send({ status: 'error', message: 'Producto no encontrado' });
             }

             await this.lawersService.deletelawer(uid);

             if (lawer && lawer.role === 'admin') {
                 await sendEmail({
                     to: lawer.email,
                     subject: 'Usuario eliminado',
                     text: `El usuario ${lawerDeleted._id} ha sido eliminado.`
                 });
                 req.logger.info(`Correo enviado a ${lawer.email} sobre la eliminación del producto ${uid}`);
             }

             res.send({ status: 'success', message: 'Producto eliminado exitosamente' });
         } catch (error) {
             req.logger.error(`Error al eliminar producto: ${error.message}, ${req.method} en ${req.url}`);
             res.status(500).send({ status: 'error', message: 'Error interno del servidor' });
         }
     }

     getProfile = async (req, res) => {
        try {
            const { uid } = req.params;
            const lawer = await this.lawersService.findById(uid);
            res.render('lawerProfile', { lawer });
        } catch (error) {
            req.logger.error(`Error al obtener el usuario: ${error.message}`);
            res.status(500).send({ error: 'Ocurrió un error al obtener los usuarios.' });
        }
}
}
