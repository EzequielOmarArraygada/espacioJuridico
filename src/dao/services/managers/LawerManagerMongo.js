import { lawerRepository } from '../../../repositories/lawer.repository.js';

export class lawerManagerMongo {
    constructor() {
        this.repository = new lawerRepository();
    }

    async findById(id) {
        return await this.repository.findById(id);
    }

    async findByEmail(email) {
        const lawer = await this.repository.findByEmail(email);
        if (!lawer) {
            console.warn(`No se encontró ningún usuario con el email '${email}'`);
            return null; 
        }
        return lawer;
    }

    async createOne(obj) {
        return await this.repository.createOne(obj);
    }

    async getAlllawers() {
        return await this.repository.getAlllawers();
    }
    
    async deleteInactivelawers() {
        return await this.repository.deleteInactivelawers();
    }

    async updatelawer(uid, updatedlawer){
        return await this.repository.updatelawer(uid, updatedlawer);
    }

    async deletelawer(uid){
        return await this.repository.deletelawer(uid);
    }

    
}
