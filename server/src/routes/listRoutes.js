/**
 * listRoutes.js
 *
 * Which controller function answers which URL. app.js mounts this router at
 * /api/lists, so '/' here means /api/lists and '/:id' means /api/lists/:id.
 */
import { Router } from 'express';
import { deleteList, getAllMetadata, getList } from '../controllers/listController.js';

const router = Router();

router.get('/', getAllMetadata);
router.get('/:id', getList);
router.delete('/:id', deleteList);

export default router;
