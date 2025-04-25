import { Router } from 'express';
import CasesRouter from './cases.router.js';
import lawersRouter from './lawers.router.js';
import DashboardRouter from './dashboard.router.js'

const router = Router()

router.use('/api/sessions', lawersRouter);
router.use('/api/cases', CasesRouter);
router.use('/admin', DashboardRouter);




export default router