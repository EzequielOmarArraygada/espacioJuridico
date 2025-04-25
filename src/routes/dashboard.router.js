import { Router } from 'express';
import { CasesController } from '../controllers/cases.controller.js';
import { lawerController } from '../controllers/lawers.controller.js';
import { ViewsController } from '../controllers/views.controller.js'
import utils from '../utils.js';
import upload from '../middlewares/upload.js';
import passport from 'passport';


const { passportCall } = utils;
const DashboardRouter = Router()

const {
    getcases,
    getCasesById,
} = new CasesController();


const {
    getDashlawers,
    isAdmin,
    postSignupDash,
    updatelawer,
    deletelawer
} = new lawerController();

const {
    renderAdmin,
} = new ViewsController

DashboardRouter.get('/', passportCall('login', 'admin'), isAdmin, renderAdmin);

DashboardRouter.get('/lawers', passportCall('login', 'admin'), isAdmin, getDashlawers);

DashboardRouter.post('/lawers/add', passport.authenticate('signup', { 
    failureRedirect: '/failregister', 
    failureMessage: true 
}), postSignupDash);

DashboardRouter.put('/lawers/update/:uid', upload.single('profileImage'), passportCall('login', 'admin'), isAdmin, updatelawer);

DashboardRouter.delete('/lawers/delete/:uid', passportCall('login', 'admin'), isAdmin, deletelawer);

export default DashboardRouter;    

