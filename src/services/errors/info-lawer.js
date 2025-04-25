import Lawer from '../../dao/models/lawer.model.js'

const lawer = new Lawer();

export const generateErrorInfo = (lawer) => {
    return `Una o más propiedades estaban incompletas o inválidas. Lista de propiedades requeridas:
    *first_name: necesita un string, se recibió ${lawer.first_name}
    *last_name: necesita un string, se recibió ${lawer.last_name}
    *age: necesita un string, se recibió ${lawer.age}`
}
