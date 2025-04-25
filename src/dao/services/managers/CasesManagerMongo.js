import { CasesRepository } from '../../../repositories/cases.repository.js';
import logger from '../../../config/logger.js'; 

export class CasesManagerMongo {
    constructor() {
        this.CasesRepository = new CasesRepository();
    }

    async getcases() {
        try {
            return await this.CasesRepository.getcases();
        } catch (error) {
            logger.error(`Error al mostrar los carritos: ${error.message}`, { error });
            throw new Error('No se pudieron obtener los carritos. Por favor, inténtelo de nuevo más tarde.');
        }
    }

    async getCasesById(cid) {
        try {
            return await this.CasesRepository.getCasesById(cid);
        } catch (error) {
            logger.error(`Error al obtener el carrito con ID ${cid}: ${error.message}`, { cid, error });
            throw new Error('No se pudo obtener el carrito especificado. Por favor, verifique el ID y vuelva a intentarlo.');
        }
    }

    async getCasesByIdCount(cid) {
        try {
            return await this.CasesRepository.getCasesByIdCount(cid);
        } catch (error) {
            logger.error(`Error al obtener el carrito con ID ${cid}: ${error.message}`, { cid, error });
            throw new Error('No se pudo obtener el carrito especificado. Por favor, verifique el ID y vuelva a intentarlo.');
        }
    }

    async addCases() {
        try {
            return await this.CasesRepository.addCases();
        } catch (error) {
            logger.error(`Error al agregar un nuevo carrito: ${error.message}`, { error });
            throw new Error('No se pudo crear un nuevo carrito. Por favor, inténtelo de nuevo más tarde.');
        }
    }

    async addToCases(CasesId, productId, quantity) {
        const Cases = await this.getCasesById(CasesId);
        const productIndex = Cases.products.findIndex(p => p.productId.toString() === productId);
    
        if (productIndex > -1) {
            // Si el producto ya existe en el carrito, sumar la cantidad nueva a la existente
            Cases.products[productIndex].quantity = parseInt(Cases.products[productIndex].quantity) + parseInt(quantity);
        } else {
            // Si el producto no está en el carrito, agregarlo con la cantidad especificada
            Cases.products.push({ productId, quantity });
        }
    
        return await Cases.save();
    }

    async updateCases(Cases) {
        try {
            return await this.CasesRepository.updateCases(Cases);
        } catch (error) {
            logger.error(`Error al actualizar el carrito con ID ${Cases.id}: ${error.message}`, { Cases, error });
            throw new Error('No se pudo actualizar el carrito. Por favor, verifique los datos del carrito e inténtelo de nuevo.');
        }
    }

    async deleteProduct(pid, cid) {
        try {
            return await this.CasesRepository.deleteProduct(pid, cid);
        } catch (error) {
            logger.error(`Error al eliminar el producto con ID ${pid} del carrito con ID ${cid}: ${error.message}`, { cid, pid, error });
            throw new Error('No se pudo eliminar el producto del carrito. Por favor, verifique los IDs e inténtelo de nuevo.');
        }
    }

    async updateProductQuantity(cid, pid, quantity) {
        try {
            return await this.CasesRepository.updateProductQuantity(cid, pid, quantity);
        } catch (error) {
            logger.error(`Error al actualizar la cantidad del producto con ID ${pid} en el carrito con ID ${cid}: ${error.message}`, { cid, pid, quantity, error });
            throw new Error('No se pudo actualizar la cantidad del producto en el carrito. Por favor, verifique los IDs y la cantidad.');
        }
    }

    async deleteAllProducts(cid) {
        try {
            return await this.CasesRepository.deleteAllProducts(cid);
        } catch (error) {
            logger.error(`Error al eliminar todos los productos del carrito con ID ${cid}: ${error.message}`, { cid, error });
            throw new Error('No se pudieron eliminar todos los productos del carrito. Por favor, inténtelo de nuevo más tarde.');
        }
    }

    async checkout(Cases, lawerEmail) {
        try {
            return await this.CasesRepository.checkout(Cases, lawerEmail);
        } catch (error) {
            logger.error(`Error al procesar la compra para el carrito con ID ${Cases.id} y usuario ${lawerEmail}: ${error.message}`, { Cases, lawerEmail, error });
            throw new Error('No se pudo completar la compra. Por favor, inténtelo de nuevo más tarde.');
        }
    }
}
