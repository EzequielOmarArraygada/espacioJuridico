import CasesModel from '../dao/models/cases.model.js';
import lawer from '../dao/models/lawer.model.js';

export class CasesRepository {
    constructor(){
        this.model = CasesModel;
        this.lawerService = lawer;
    }

    async getcases(){
        try {
            return await this.model.find({}).populate('products');
        } catch (error) {
            console.error('Error al obtener todos los carritos:', error);
            throw error;
        }
    }

    async getCasesById(cid) {
        try {
            return await this.model.findById(cid).populate('products');
        } catch (error) {
            console.error(`Error al obtener el carrito con ID ${cid}:`, error);
            throw error;
        }
    }

    async getCasesByIdCount(cid) {
        try {
            return await this.model.findById(cid).populate('products');
        } catch (error) {
            console.error(`Error al obtener el carrito con ID ${cid}:`, error);
            throw error;
        }
    }    
    async addCases(lawerEmail) {
        const newCases = {
            products: [],
            lawerEmail: lawerEmail
        };
        try {
            return await this.model.create(newCases);
        } catch (error) {
            console.error('Error al agregar un nuevo carrito:', error);
            throw error;
        }
    }

    async addToCases(cid, pid) {
        try {
            const CasesExists = await this.model.findOne({ _id: cid });
            if (!CasesExists) {
                throw new Error(`No se encontró el carrito con ID ${cid}`);
            }
    
            const productExists = await productModel.findOne({ _id: pid });
            if (!productExists) {
                throw new Error(`No se encontró el producto con ID ${pid}`);
            }
    
            const existingProduct = CasesExists.products.find(product => product.productId.toString() === pid.toString());
            if (existingProduct) {
                existingProduct.quantity++;
            } else {
                CasesExists.products.push({
                    productId: pid,
                    quantity: 1
                });
            }
    
            await CasesExists.save();
            return CasesExists;
        } catch (error) {
            console.error(`Error al agregar el producto al carrito:`, error);
            throw error;
        }
    }
    
    async updateCases(Cases) {
        try {
            await this.model.findByIdAndUpdate(Cases._id, Cases);
            return 'Carrito actualizado exitosamente';
        } catch (error) {
            console.error('Error al actualizar el carrito:', error);
            throw error;
        }
    }

    async deleteProduct(pid, cid) {
        try {
            const Cases = await this.model.findById(cid);
            if (!Cases) {
                throw new Error(`No se encontró el carrito con ID ${cid}`);
            }
    
            const productIndex = Cases.products.findIndex(product => product.productId.toString() === pid.toString());
            if (productIndex === -1) {
                throw new Error(`No se encontró el producto con ID ${pid} en el carrito`);
            }
    
            Cases.products.splice(productIndex, 1); 

            await this.updateCases(Cases);

            return 'Producto eliminado exitosamente del carrito';
        } catch (error) {
            console.error('Error al eliminar el producto del carrito:', error);
            throw error;
        }
    }

    async updateProductQuantity(cid, pid, quantity) {
        try {
            const Cases = await this.model.findById(cid);
            if (!Cases) {
                throw new Error(`No se encontró el carrito con ID ${cid}`);
            }

            const productIndex = Cases.products.findIndex(product => product.productId.toString() === pid.toString());
            if (productIndex === -1) {
                throw new Error(`No se encontró el producto con ID ${pid} en el carrito`);
            }

            Cases.products[productIndex].quantity = quantity;

            await this.updateCases(Cases);

            return 'Cantidad de producto actualizada exitosamente en el carrito';

        } catch (error) {
            console.error('Error al actualizar la cantidad del producto en el carrito:', error);
            throw error;
        }
    }

    async deleteAllProducts(cid) {
        try {
            const Cases = await this.model.findById(cid);
            if (!Cases) {
                throw new Error(`No se encontró el carrito con ID ${cid}`);
            }
    
            Cases.products = []; 
    
            await this.updateCases(Cases);
    
            return 'Todos los productos fueron eliminados del carrito exitosamente';
        } catch (error) {
            console.error('Error al eliminar todos los productos del carrito:', error);
            throw error;
        }
    }

    async checkout(CasesId) {
        try {
            function generateUniqueCode() {
                const timestamp = new Date().getTime();
                const random = Math.floor(Math.random() * 1000);
                return `${timestamp}-${random}`;
            }            
    
            const Cases = await this.getCasesById(CasesId);
    
            const lawer = await lawer.findOne({ Cases: Cases._id });
            if (!lawer) {
                throw new Error('No se encontró el usuario asociado al carrito');
            }
    
            const lawerEmail = lawer.email;
    
            const productsInTicket = [];
            const productsInCases = [];
            let totalAmount = 0;
            for (const product of Cases.products) {
                const productDetails = await productModel.findById(product.productId);
    
                if (productDetails.stock >= product.quantity) {
                    const subtotal = productDetails.price * product.quantity;
                    totalAmount += subtotal;
                    productsInTicket.push({
                        productId: productDetails._id,
                        quantity: product.quantity,
                        price: productDetails.price,
                        subtotal: subtotal
                    });
    
                    productDetails.stock -= product.quantity;
                    await productDetails.save();
                } else {
                    productsInCases.push({
                        productId: productDetails._id,
                        quantity: 0,
                        price: productDetails.price,
                        subtotal: 0
                    });
                }
            }
    
            Cases.products = productsInCases;
            await Cases.save();
    
            const ticket = new Ticket({
                code: generateUniqueCode(),
                purchaser: lawerEmail,
                products: productsInTicket,
                totalAmount: totalAmount
            });
    
            await ticket.save();
    
            return ticket;
        } catch (error) {
            console.error('Error al procesar la compra:', error);
            throw error;
        }
    }    
}
