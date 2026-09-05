import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/connection.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80).optional(),
});

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change-me-in-local-env') {
    const err = new Error('JWT_SECRET is not configured');
    err.status = 500;
    throw err;
  }
  return jwt.sign(
    { sub: user.id, email: user.email, displayName: user.display_name },
    secret,
    { expiresIn: '7d' },
  );
}

authRouter.post('/register', (req, res, next) => {
  try {
    const parsed = credentialsSchema.parse(req.body);
    const displayName = parsed.displayName || parsed.email.split('@')[0];
    const passwordHash = bcrypt.hashSync(parsed.password, 10);

    const insert = db.prepare(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
    );
    const result = insert.run(parsed.email.toLowerCase(), passwordHash, displayName);
    const user = {
      id: Number(result.lastInsertRowid),
      email: parsed.email.toLowerCase(),
      display_name: displayName,
    };

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid registration payload', details: err.errors });
    }
    if (String(err.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return next(err);
  }
});

authRouter.post('/login', (req, res, next) => {
  try {
    const parsed = credentialsSchema.omit({ displayName: true }).parse(req.body);
    const user = db
      .prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?')
      .get(parsed.email.toLowerCase());

    if (!user || !bcrypt.compareSync(parsed.password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, displayName: user.display_name },
    });
  } catch (err) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid login payload', details: err.errors });
    }
    return next(err);
  }
});
