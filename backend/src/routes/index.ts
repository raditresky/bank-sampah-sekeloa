import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import sampahRoutes from './sampah.routes';
import transaksiRoutes from './transaksi.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sampah', sampahRoutes);
router.use('/transaksi', transaksiRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

