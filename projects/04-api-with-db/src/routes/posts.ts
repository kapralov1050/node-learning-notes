import { Router } from 'express';
import * as postController from '../controllers/postController';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', postController.index);
router.get('/:id', postController.show);
router.post('/', postController.create);
router.put('/:id', postController.update);
router.delete('/:id', postController.remove);
router.post('/:id/cover', upload.single('image'), postController.uploadCover)

export default router;
