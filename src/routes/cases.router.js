import { Router } from 'express';
import { CasesController } from '../controllers/cases.controller.js';
import utils from '../utils.js';
import express from 'express'

const { passportCall } = utils;
const CasesRouter = Router()

const {
    getCases,
    getCasesById,
    addCases,
    addToCases,
    updateProductQuantity,
    updateCases,
    deleteProduct,
    deleteAllProducts,
    getCasesByIdCount,
    createOrder,
    handlePaymentSuccess,
    paymentSuccess,
    handleWebhook,
    paymentPending,
    paymentFailure,
    handlePaymentPending,
    handlePaymentFailure,
} = new CasesController();


CasesRouter.get('/createorder', passportCall('login', 'lawer'), createOrder);

CasesRouter.get('/createOrder/:cid', passportCall('login', 'lawer'), createOrder);

CasesRouter.get('/success', handlePaymentSuccess);

CasesRouter.get('/pending', handlePaymentPending);

CasesRouter.get('/failure', handlePaymentFailure);

CasesRouter.get('/paymentFailure/:tid', passportCall('login', 'lawer'), paymentFailure);

CasesRouter.get('/paymentPending/:tid', passportCall('login', 'lawer'), paymentPending);

CasesRouter.get('/paymentSuccess/:tid', passportCall('login', 'lawer'), paymentSuccess);

CasesRouter.post('/webhook', handleWebhook);

CasesRouter.get('/', passportCall('login', 'lawer'), getCases);

CasesRouter.get('/:cid', passportCall('login', 'lawer'), getCasesById);

CasesRouter.get('/:cid/count', passportCall('login', 'lawer'), getCasesByIdCount);

CasesRouter.post('/', addCases);

CasesRouter.post('/:cid/:pid', passportCall('login', 'lawer'), addToCases);

CasesRouter.put('/:cid/products/:pid', updateProductQuantity);

CasesRouter.put('/:cid', passportCall('login', 'lawer'), updateCases);

CasesRouter.delete('/:cid/products/:pid', deleteProduct);

CasesRouter.delete('/:cid', deleteAllProducts);

export default CasesRouter;
