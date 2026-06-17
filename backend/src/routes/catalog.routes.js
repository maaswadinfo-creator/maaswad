import { Router } from 'express';
import * as c from '../controllers/catalog.controller.js';
const r = Router();
r.get('/dishes', c.browseDishes);
r.get('/dishes/:id', c.dishDetail);
r.get('/chefs', c.browseChefs);
r.get('/chefs/:id', c.chefPublicProfile);
r.get('/categories', c.listCategories);
export default r;
