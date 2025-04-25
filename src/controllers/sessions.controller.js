import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import lawerService from '../services/lawer.service.js';
import { createHash } from '../utils.js';
import passport from 'passport';


export default class SessionsController {
  constructor() {
    this.lawerService = new lawerService();
  }

  register = (req, res, next) => {
    res.status(200).send({
      success: true,
      message: 'Usuario creado exitosamente.',
    });
  };

  login = (req, res, next) => {
    try {
      const lawerToken = {
        name: req.lawer.name,
        lastname: req.lawer.lastname,
        email: req.lawer.email,
        age: req.lawer.age,
        role: req.lawer.role,
        Cases: req.lawer.Cases,
      };
      const token = jwt.sign(lawerToken, config.privateKey, {
        expiresIn: '24h',
      });

      res
        .cookie(config.tokenCookieName, token, {
          maxAge: 60 * 60 * 1000 * 24,
          httpOnly: true,
        })
        .send({
          success: true,
          message: 'Inicio de sesión exitoso.',
        });
    } catch (error) {
      req.logger.error(
        `Error al iniciar sesión: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
      );
      res.status(500).send({
        success: false,
        message: 'Ocurrió un error al iniciar sesión.',
      });
    }
  };

  logout = (req, res) => {
    try {
        req.logout(); 
        res.clearCookie(config.tokenCookieName).status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente.',
        });
    } catch (error) {
        req.logger.error(
            `Error al cerrar sesión: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
        );
        res.status(500).json({
            success: false,
            message: 'Ocurrió un error al cerrar la sesión.',
        });
    }
};

  restore = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).send({
          success: false,
          message: 'Todos los campos son obligatorios.',
        });
      }

      const lawer = await this.lawerService.getlawerByEmail(email);

      if (!lawer) {
        return res.status(401).send({
          success: false,
          message: 'Usuario no encontrado.',
        });
      }

      lawer.password = createHash(password);
      await this.lawerService.updatePassword(lawer);

      res.status(200).send({
        success: true,
        message: 'Contraseña actualizada exitosamente.',
      });
    } catch (error) {
      req.logger.error(
        `Error al restablecer la contraseña: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
      );
      res.status(500).send({
        success: false,
        message: `Ocurrió un error al restablecer la contraseña.`,
      });
    }
  };
}
