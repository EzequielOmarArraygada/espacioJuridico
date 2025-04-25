import { CasesManagerMongo } from '../dao/services/managers/CasesManagerMongo.js';
import { lawerRepository } from '../repositories/lawer.repository.js';
import { sendCompraAprobada, sendCompraPendiente, sendCompraCancelada } from '../services/mailing.js'
import mercadopago from 'mercadopago';
import dotenv from "dotenv"
import {formatDate} from '../utils/utils.js'

dotenv.config();

const generateTicketCode = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    return `${timestamp}-${randomNum}`;
};



export class CasesController {
    constructor() {
        this.casesService = new CasesManagerMongo();
        this.lawerService = new lawerRepository();
    }

    getCases = async (req, res) => {
        try {
            let result = await this.casesService.getCases()
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al recuperar los carritos: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al obtener los carritos.' });
        }
    }

    getCasesById = async (req, res) => {
        try {
            const { cid } = req.params;
            const Cases = await this.casesService.getCasesById(cid);
            const lawer = req.lawer
            const productsDetails = [];
            let totalPrice = 0;

            for (const product of Cases.products) {
                const productDetails = await this.productsService.getProduct(product.productId);
                const productWithQuantity = { ...productDetails, quantity: product.quantity };
                productsDetails.push(productWithQuantity);

                const subtotal = productDetails.price * product.quantity;
                totalPrice += subtotal;
            }
            res.render('cases', { Cases, lawer, productsDetails, totalPrice, CasesId: Cases._id });
        } catch (error) {
            req.logger.error(
                `Error al recuperar el carrito por ID: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al obtener el carrito.' });
        }
    }

    getCasesByIdCount = async (req, res) => {
        try {
            const { cid } = req.params;
            const CasesCount = await this.casesService.getCasesByIdCount(cid);
            if (!CasesCount) {
                return res.status(404).send({ error: 'Carrito no encontrado.' });
            }

            const productsDetailsCount = [];
            let totalPriceCount = 0;

            for (const product of CasesCount.products) {
                const productDetailsCount = await this.productsService.getProduct(product.productId);
                const productWithQuantityCount = { ...productDetailsCount, quantity: product.quantity };
                productsDetailsCount.push(productWithQuantityCount);

                const subtotalCount = productDetailsCount.price * product.quantity;
                totalPriceCount += subtotalCount;
            }
            res.send({ result: 'success', Cases: CasesCount, productsDetailsCount, totalPriceCount });
        } catch (error) {
            req.logger.error(
                `Error al recuperar el carrito por ID: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al obtener el carrito.' });
        }
    }

    addCases = async (req, res) => {
        let result = await this.casesService.addCases();
        res.send({ result: 'success', payload: result });
    }

    addToCases = async (req, res) => {
        try {
            let { cid, pid } = req.params;
            let lawerId = req.session.clientId;
            let { quantity } = req.body;

            if (!cid || !pid || !quantity || isNaN(quantity) || quantity <= 0) {
                req.logger.error(`Faltan parámetros o cantidad inválida: cid (${cid}), pid (${pid}), quantity (${quantity}).`);
                return res.status(400).send({ error: 'Faltan el ID del carrito, el ID del producto o la cantidad es inválida.' });
            }

            const product = await this.productsService.getProduct(pid);
            if (!product) {
                req.logger.error(`Producto no encontrado: pid (${pid}).`);
                return res.status(404).send({ error: 'Producto no encontrado.' });
            }

            if (product.owner.toString() === lawerId) {
                req.logger.warning(
                    `El usuario intentó agregar su propio producto al carrito: ${product._id}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
                );
                return res.status(400).send({ error: 'No puedes agregar tu propio producto al carrito.' });
            }

            if (product.stock < quantity) {
                req.logger.warning(
                    `Cantidad solicitada mayor que el stock disponible: ${product._id}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
                );
                return res.status(400).send({ error: 'La cantidad solicitada supera el stock disponible.' });
            }

            const result = await this.casesService.addToCases(cid, pid, quantity);
            req.logger.debug(`Producto agregado al carrito: ${result}`);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al agregar el producto al carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al agregar el producto al carrito.' });
        }
    }


    updateProductQuantity = async (req, res) => {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;
            const result = await this.casesService.updateProductQuantity(cid, pid, quantity);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al actualizar la cantidad del producto en el carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al actualizar la cantidad del producto en el carrito.' });
        }
    }

    updateCases = async (req, res) => {
        try {
            const { cid } = req.params;
            const result = await this.casesService.updateCases(cid);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al actualizar el carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al actualizar el carrito.' });
        }
    }

    deleteProduct = async (req, res) => {
        let { cid, pid } = req.params;
        let result = await this.casesService.deleteProduct(pid, cid);
        res.send({ result: 'success', payload: result });
    }

    deleteAllProducts = async (req, res) => {
        try {
            const { cid } = req.params;
            const result = await this.casesService.deleteAllProducts(cid);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al eliminar todos los productos del carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al eliminar todos los productos del carrito.' });
        }
    }

    createOrder = async (req, res) => {
        try {
            const { cid } = req.params;
            const Cases = await this.casesService.getCasesById(cid);

            if (!Cases || Cases.products.length === 0) {
                return res.status(400).json({ message: 'El carrito está vacío' });
            }

            const preferenceItems = [];
            const productsDetails = [];
            let totalAmount = 0
            for (const product of Cases.products) {
                const productDetails = await this.productsService.getProduct(product.productId);
                preferenceItems.push({
                    title: productDetails.title,
                    unit_price: productDetails.price,
                    currency_id: "ARS",
                    quantity: product.quantity,
                });
                productsDetails.push({ ...productDetails, quantity: product.quantity });
                totalAmount += productDetails.price * product.quantity;
            }

            // Generar ticket anticipado con estado "Pendiente"
            const comprador = await this.lawerService.findById(req.lawer._id);
            const code = generateTicketCode();


            const emptyTicket = new Ticket({
                code,
                purchaser: comprador,
                products: productsDetails,
                totalAmount: totalAmount,
                status: "Pendiente",
                purchase_datetime: new Date(),
                paymentInf: {}
            });

            const savedTicket = await emptyTicket.save();

            // Crear preferencia
            const preference = {
                items: preferenceItems,
                back_urls: {
                    success: "https://ymir.up.railway.app/api/cases/success",
                    failure: "https://ymir.up.railway.app/api/cases/failure",
                    pending: "https://ymir.up.railway.app/api/cases/pending"
                },
                external_reference: JSON.stringify({ ticketId: savedTicket._id, compradorId: comprador.id }),
                notification_url: "https://ymir.up.railway.app/api/cases/webhook",
                auto_return: "approved",
            };

            const response = await mercadopago.preferences.create(preference);

            return res.status(200).json({
                message: "Orden creada con éxito",
                init_point: response.body.init_point
            });
        } catch (error) {
            console.error('Error al crear la orden:', error);
            return res.status(500).json({ message: 'Error interno del servidor', error });
        }
    };

    handlePaymentSuccess = async (req, res) => {
        try {
            const paymentId = req.query.payment_id;
            const payment = await mercadopago.payment.findById(paymentId);
            const paymentInfo = payment.body;
            const metodoPago = paymentInfo.payment_type_id;
            const fechaPago = paymentInfo.date_approved;
            let ultimosDigitos = null;
            let cuotas = null;
            let metodo = null;
            let ticketId = null;
            let compradorId = null;

                if (paymentInfo.card) {
                    ultimosDigitos = paymentInfo.card.last_four_digits || null;
                    cuotas = paymentInfo.installments || null;
                    metodo = getFriendlyPaymentMethod(paymentInfo.payment_method_id);
                } else {
                    console.warn("⚠️ El objeto 'card' no está presente en el pago.");
                }

            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    ticketId = parsedRef.ticketId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }

            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    compradorId = parsedRef.compradorId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }

            let ticket = null;
            if (ticketId) {
                ticket = await Ticket.findById(ticketId).populate("purchaser");
            }

            if (!ticket) {
                req.logger.error(`Ticket no encontrado o inválido. ticketId: ${ticketId}`);
                return res.status(404).json({ error: 'Ticket no encontrado o inválido' });
            }
            let lawer = await this.lawerService.findById(compradorId);
            const Cases = await this.casesService.getCasesById(lawer.Cases._id);


            if (ticket.status !== "Aprobado" && paymentInfo.status === "approved") {
                const Cases = await this.casesService.getCasesById(ticket.purchaser.Cases);
                const productsDetails = [];
                if (Cases && Cases.products.length > 0) {
                    for (const product of Cases.products) {
                        const productDetails = await this.productsService.getProduct(product.productId);

                        if (productDetails.stock < product.quantity) {
                            return res.render('failure', {
                                message: `El producto ${productDetails.title} no tiene suficiente stock.`
                            });
                        }

                        productsDetails.push({ ...productDetails, quantity: product.quantity });
                        await this.productsService.updateProduct(product.productId, {
                            stock: productDetails.stock - product.quantity
                        });
                    }

                    ticket.paymentInf = {
                        method: metodoPago,
                        paymentDate: fechaPago,
                        card: {
                            lastFourDigits: ultimosDigitos,
                            installments: cuotas,
                            issuerName: metodo
                        }
                    };
                    ticket.status = "Aprobado";
                    await ticket.save();
                }

                // Enviar mail
                await sendCompraAprobada(lawer.email, ticket);
            }

            if (Cases) {
                Cases.products = [];
                await Cases.save();
            }

            return res.redirect(`/api/cases/paymentSuccess/${ticket._id}`);
        } catch (error) {
            console.error("Error en handlePaymentSuccess:", error);
            return res.status(500).json({ message: "Error al procesar el pago", error });
        }
    };

    handlePaymentPending = async (req, res) => {
        try {
            const paymentId = req.query.payment_id;
            const payment = await mercadopago.payment.findById(paymentId);
            const paymentInfo = payment.body;
            const metodoPago = paymentInfo.payment_type_id;
            const fechaPago = paymentInfo.date_approved;
            let ultimosDigitos = null;
            let cuotas = null;
            let metodo = null;
            let ticketId = null;
            let compradorId = null;

                if (paymentInfo.card) {
                    ultimosDigitos = paymentInfo.card.last_four_digits || null;
                    cuotas = paymentInfo.installments || null;
                    metodo = getFriendlyPaymentMethod(paymentInfo.payment_method_id);
                } else {
                    console.warn("⚠️ El objeto 'card' no está presente en el pago.");
                }

            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    ticketId = parsedRef.ticketId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }


            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    ticketId = parsedRef.ticketId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }

            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    compradorId = parsedRef.compradorId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }

            let ticket = null;
            if (ticketId) {
                ticket = await Ticket.findById(ticketId).populate("purchaser");
            }

            if (!ticket) {
                req.logger.error(`Ticket no encontrado o inválido. ticketId: ${ticketId}`);
                return res.status(404).json({ error: 'Ticket no encontrado o inválido' });
            }
            let lawer = await this.lawerService.findById(compradorId);
            const Cases = await this.casesService.getCasesById(lawer.Cases._id);

                const productsDetails = [];
                if (Cases && Cases.products.length > 0) {
                    for (const product of Cases.products) {
                        const productDetails = await this.productsService.getProduct(product.productId);

                        if (productDetails.stock < product.quantity) {
                            return res.render('failure', {
                                message: `El producto ${productDetails.title} no tiene suficiente stock.`
                            });
                        }

                        productsDetails.push({ ...productDetails, quantity: product.quantity });
                        await this.productsService.updateProduct(product.productId, {
                            stock: productDetails.stock - product.quantity
                        });
                    }

                    ticket.paymentInf = {
                        method: metodoPago,
                        paymentDate: fechaPago,
                        card: {
                            lastFourDigits: ultimosDigitos,
                            installments: cuotas,
                            issuerName: metodo
                        }
                    };
                    await ticket.save()

                // Enviar mail
                await sendCompraPendiente(lawer.email, ticket);
            }

            if (Cases) {
                Cases.products = [];
                await Cases.save();
            }

            return res.redirect(`/api/cases/paymentPending/${ticket._id}`);
        } catch (error) {
            console.error("Error en handlePaymentPending:", error);
            return res.status(500).json({ message: "Error al procesar el pago", error });
        }
    };

    handlePaymentFailure = async (req, res) => {
        try {
            const paymentId = req.query.payment_id;
            const payment = await mercadopago.payment.findById(paymentId);
            const paymentInfo = payment.body;
            const metodoPago = paymentInfo.payment_type_id;
            const fechaPago = paymentInfo.date_approved;
            let ticketId = null;
            let compradorId = null;
            let ultimosDigitos = null;
            let cuotas = null;
            let metodo = null;

                if (paymentInfo.card) {
                    ultimosDigitos = paymentInfo.card.last_four_digits || null;
                    cuotas = paymentInfo.installments || null;
                    metodo = getFriendlyPaymentMethod(paymentInfo.payment_method_id);
                } else {
                    console.warn("⚠️ El objeto 'card' no está presente en el pago.");
                }

            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    ticketId = parsedRef.ticketId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }


            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    ticketId = parsedRef.ticketId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }

            if (paymentInfo.external_reference) {
                try {
                    const parsedRef = JSON.parse(paymentInfo.external_reference);
                    compradorId = parsedRef.compradorId;
                } catch (err) {
                    console.warn("No se pudo parsear external_reference:", err);
                }
            }

            let ticket = null;
            if (ticketId) {
                ticket = await Ticket.findById(ticketId).populate("purchaser");
                ticket.status = "Cancelado";
                ticket.paymentInf = {
                    method: metodoPago,
                    paymentDate: fechaPago,
                    card: {
                        lastFourDigits: ultimosDigitos,
                        installments: cuotas,
                        issuerName: metodo
                    }
                };
                await ticket.save();
            }

            if (!ticket) {
                req.logger.error(`Ticket no encontrado o inválido. ticketId: ${ticketId}`);
                return res.status(404).json({ error: 'Ticket no encontrado o inválido' });
            }
            let lawer = await this.lawerService.findById(compradorId);
            await sendCompraCancelada(lawer.email, ticket);
            return res.redirect(`/api/cases/paymentFailure/${ticketId}`);
        } catch (error) {
            console.error("Error en handlePaymentFailure:", error);
            return res.status(500).json({ message: "Error al procesar el pago", error });
        }
    };

    paymentSuccess = async (req, res) => {
        try {
            const { tid } = req.params;
            const ticket = await Ticket.findById(tid).populate("purchaser");
            
            if (!ticket) {
                return res.status(404).render("failure", { message: "No se encontró el ticket con ese ID." });
            }

            res.render("paymentSuccess", { ticket });
        } catch (error) {
            console.error("Error al cargar la vista de éxito:", error);
            res.status(500).send("Error al mostrar el resumen del pago");
        }
    };

    paymentPending = async (req, res) => {
        try {
            const { tid } = req.params;
            const ticket = await Ticket.findById(tid).populate("purchaser");

            if (!ticket) {
                return res.status(404).render("failure", { message: "No se encontró el ticket con ese ID." });
            }

            res.render("paymentPending", { ticket });
        } catch (error) {
            console.error("Error al cargar la vista de éxito:", error);
            res.status(500).send("Error al mostrar el resumen del pago");
        }
    };

    paymentFailure = async (req, res) => {
        try {
            const { tid } = req.params;
            const ticket = await Ticket.findById(tid).populate("purchaser");

            if (!ticket) {
                return res.status(404).render("failure", { message: "No se encontró el ticket con ese ID." });
            }

            res.render("paymentFailure");
        } catch (error) {
            console.error("Error al cargar la vista de éxito:", error);
            res.status(500).send("Error al mostrar el resumen del pago");
        }
    };

    handleWebhook = async (req, res) => {
        try {
            const topic = req.query.topic;
            const resourceId = req.query.id;

            if (topic === "payment") {
                const payment = await mercadopago.payment.findById(resourceId);
                const externalRefRaw = payment.body.external_reference;

                if (!externalRefRaw) {
                    console.warn("⚠️ external_reference no presente en el pago");
                    return res.status(400).send("Falta external_reference");
                }

                const externalRef = JSON.parse(externalRefRaw);
                const ticketId = externalRef.ticketId;
                const compradorId = externalRef.compradorId;
                const paymentInfo = payment.body;
                const metodoPago = paymentInfo.payment_type_id;
                const fechaPago = paymentInfo.date_approved;
                let ultimosDigitos = null;
                let cuotas = null;
                let metodo = null;

                if (paymentInfo.card) {
                    ultimosDigitos = paymentInfo.card.last_four_digits || null;
                    cuotas = paymentInfo.installments || null;
                    metodo = getFriendlyPaymentMethod(paymentInfo.payment_method_id);
                } else {
                    console.warn("⚠️ El objeto 'card' no está presente en el pago.");
                }

                const comprador = await this.lawerService.findById(compradorId);
                const ticket = await Ticket.findById(ticketId).populate("purchaser");

                if (!ticket) {
                    return res.status(404).send("Ticket no encontrado");
                }

                let Cases = null;

                if (ticket.status !== "Aprobado" && payment.body.status === "approved") {
                    Cases = await this.casesService.getCasesById(ticket.purchaser.Cases);

                    if (Cases && Cases.products.length > 0) {
                        let totalAmount = 0;

                        for (const item of ticket.products) {
                            const rawProduct = await this.productsService.getProduct(item._id);
                            const product = productModel.hydrate(rawProduct);

                            if (product.stock >= item.quantity) {
                                product.stock -= item.quantity;
                                await product.save();

                                totalAmount += product.price * item.quantity;
                            }
                        }

                        ticket.products = ticket.products;
                        ticket.totalAmount = totalAmount;
                        ticket.status = "Aprobado";
                        ticket.paymentInf = {
                            method: metodoPago,
                            paymentDate: fechaPago,
                            card: {
                                lastFourDigits: ultimosDigitos,
                                installments: cuotas,
                                issuerName: metodo
                            }}
                        await ticket.save();

                        // Enviar mail
                        await sendCompraAprobada(comprador.email, ticket);

                        if (Cases) {
                            Cases.products = [];
                            await Cases.save();
                        }
                    }
                }

                if (ticket.status !== "Cancelado" && payment.body.status === "failure") {
                    Cases = await this.casesService.getCasesById(ticket.purchaser.Cases);

                    if (Cases && Cases.products.length > 0) {
                        let totalAmount = 0;

                        for (const item of ticket.products) {
                            const rawProduct = await this.productsService.getProduct(item._id);
                            const product = productModel.hydrate(rawProduct);

                            if (product.stock >= item.quantity) {
                                product.stock -= item.quantity;
                                await product.save();

                                totalAmount += product.price * item.quantity;
                            }
                        }

                        ticket.products = ticket.products;
                        ticket.totalAmount = totalAmount;
                        ticket.status = "Cancelado";
                        ticket.paymentInf = {
                            method: metodoPago,
                            paymentDate: fechaPago,
                            card: {
                                lastFourDigits: ultimosDigitos,
                                installments: cuotas,
                                issuerName: emisor
                            }}
                        await ticket.save();

                        // Enviar mail
                        await sendCompraCancelada(comprador.email, ticket);

                        if (Cases) {
                            Cases.products = [];
                            await Cases.save();
                        }
                    }
                }

                return res.status(200).send("Webhook procesado con éxito");
            }

            // Si el topic no es "payment", ignoramos
            return res.status(200).send("Topic no manejado");
        } catch (error) {
            console.error("❌ Error en webhook:", error);
            return res.status(500).send("Error al procesar el webhook");
        }
    };


    getlawerCasesId = async (req, res) => {
        try {
            const lawerId = req.lawer._id;
            req.logger.debug(
                `ID del usuario: ${lawerId}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );

            const lawer = await this.lawerService.findById(lawerId);

            if (lawer) {
                req.logger.debug(
                    `ID del carrito del usuario: ${lawer.Cases}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
                );
                res.status(200).json({ CasesId: lawer.Cases });
            } else {
                res.status(404).json({ error: 'Usuario no encontrado.' });
            }
        } catch (error) {
            req.logger.error(
                `Error al recuperar el ID del carrito del usuario: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }



}
