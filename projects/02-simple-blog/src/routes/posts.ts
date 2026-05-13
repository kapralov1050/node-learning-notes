import { Router } from "express";
import * as postController from '../controllers/postController'

const router = Router();

router.get('/', postController.index);
router.get('/new', postController.newForm);
router.post('/', postController.create);
router.get('/:id', postController.show);
router.get('/:id/edit', postController.editForm);
router.post('/:id/update', postController.update);
router.post('/:id/delete', postController.remove)


export default router;