import lawer from '../dao/models/lawer.model.js';

export class lawerRepository {
    constructor() {
        this.model = lawer;
    }

    async findById(id) {
        try {
            const lawer = await this.model.findById(id);
            if (!lawer) {
                return null; 
            }
            return lawer;
        } catch (error) {
            console.error(`Error al buscar usuario por ID ${id}:`, error);
            throw error; 
        }
    }

    async findByEmail(email) {
        try {
            const lawer = await this.model.findOne({ email });
            if (!lawer) {
                return null; 
            }
            return lawer;
        } catch (error) {
            console.error(`Error al buscar usuario por email '${email}':`, error);
            throw error; 
        }
    }

    async createOne(obj) {
        try {
            const lawer = await this.model.create(obj);
            return lawer;
        } catch (error) {
            console.error('Error al crear un usuario:', error);
            throw error; 
        }
    }

    async getAlllawers() {
        try {
            // Retornamos solo los campos necesarios
            return await this.model.find({}, 'first_name last_name email age role last_connection');
        } catch (error) {
            console.error('Error al obtener todos los usuarios:', error);
            throw error;
        }
    }

    async deleteInactivelawers() {
        try {
            // Obtener la fecha límite para la inactividad
            const inactivityDate = new Date(Date.now() - 30 * 60 * 1000); 
            const lawers = await this.model.find({ last_connection: { $lt: inactivityDate } });

            if (lawers.length > 0) {
                // Enviar correos a los usuarios inactivos (puedes ajustar el método de envío de correo aquí)
                for (const lawer of lawers) {
                    // Lógica para enviar correo (esto es un pseudocódigo, ajusta con tu método de envío real)
                    console.log(`Enviando correo a ${lawer.email} para notificar la eliminación por inactividad.`);
                }

                // Eliminar usuarios inactivos
                await this.model.deleteMany({ _id: { $in: lawers.map(lawer => lawer._id) } });
            }

            return { status: 'success', message: 'Usuarios inactivos eliminados', count: lawers.length };
        } catch (error) {
            console.error('Error al eliminar usuarios inactivos:', error);
            throw error;
        }
    }

    async updatelawer(uid, updatedlawer){
        try {
            const result = await this.model.findByIdAndUpdate(uid, updatedlawer, { new: true });
            if (!result) {
                console.error(`No se encontró el usuario con el ID: ${uid}`);
                throw new Error(`No se pudo actualizar el usuario`);
            }
            return result;
        } catch (error) {
            console.error(`Error al actualizar el usuario`, error);
            throw error;
        }
    }
    
    async deletelawer(uid){
        try {
            return await this.model.findByIdAndDelete(uid);
        } catch (error) {
            console.error(`Error al eliminar el usuario con ID ${uid}:`, error);
            throw error;
        }
    }

}
