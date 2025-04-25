import passport from 'passport';
import jwt from 'passport-jwt';
import passportLocal from 'passport-local';
import utils from '../utils.js';
import { lawerManagerMongo } from '../dao/services/managers/LawerManagerMongo.js';
import CustomError from '../services/errors/CustomError.js';
import EError from '../services/errors/enums.js';
import { generateErrorInfo } from '../services/errors/info-lawer.js';

const LocalStrategy = passportLocal.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJwt = jwt.ExtractJwt;

const u = new lawerManagerMongo();

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return passwordRegex.test(password);
};

const initializePassport = () => {

    const cookieExtractor = (req) => {
        let token = null;
        if (req && req.cookies) {
            token = req.cookies['coderCookieToken'];
        }
        return token;
    };

    passport.use('signup', new LocalStrategy(
        { passReqToCallback: true, lawernameField: 'email' },
        async (req, email, password, done) => {
            const { first_name, last_name, age } = req.body;
            email = email.toLowerCase();

            if (!first_name || !last_name || !age) {
                return done(null, false, { message: 'Todos los campos son obligatorios' });
            }

            if (!validateEmail(email)) {
                return done(null, false, { message: 'El email no es válido' });
            }

            if (!validatePassword(password)) {
                return done(null, false, { message: 'La contraseña debe tener al menos 6 caracteres, incluir una letra y un número' });
            }

            try {
                let lawer = await u.findByEmail(email);
                if (lawer) {
                    return done(null, false, { message: 'El usuario ya existe' });
                }

                const newlawer = {
                    first_name,
                    last_name,
                    email,
                    age,
                    password: utils.createHash(password), 
                };

                let result = await u.createOne(newlawer);
                return done(null, result);

            } catch (error) {
                return done(error);
            }
        }
    ));

    passport.use('login', new JWTStrategy(
        {
            jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
            secretOrKey: process.env.JWT_SECRET,
        },
        (jwt_payload, done) => {
            try {
                return done(null, jwt_payload);
            } catch (error) {
                return done(error);
            }
        }
    ));

    passport.serializeUser((lawer, done) => {
        done(null, lawer._id);
    });
    
    passport.deserializeUser(async (id, done) => {
        try {
            let lawer = await u.findById(id);
            done(null, lawer);
        } catch (error) {
            done(error);
        }
    });
};



export default initializePassport;
