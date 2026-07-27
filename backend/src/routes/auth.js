import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { parseLoginDto } from '../dto/login.dto.js';
import { authenticateUser } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Intenta más tarde.' },
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  const parsed = parseLoginDto(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.message });
  }

  try {
    const result = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!result) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('POST /auth/login error:', error);
    return res.status(500).json({ error: 'Error interno de autenticación' });
  }
});

router.get('/auth/me', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

export default router;
