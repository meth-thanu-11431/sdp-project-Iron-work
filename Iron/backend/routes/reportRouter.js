import express from 'express';
import {getLast3DaysTopSellingItems,getTodayTopSellingItems,getLastWeekTopSellingItems} from '../controllers/reportController.js';

const reportrouter = express.Router();


reportrouter.get('/today',getTodayTopSellingItems);
reportrouter.get('/last',getLast3DaysTopSellingItems);
reportrouter.get('/week',getLastWeekTopSellingItems);
export default reportrouter;
