import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';

export const statusesRouter = Router();

const statusSchema = z.object({
  body: z.string().min(1).max(500),
  mood: z.enum(['focused', 'blocked', 'shipping', 'ooo']).default('focused'),
});

statusesRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.id, s.body, s.mood, s.created_at, s.updated_at,
              u.display_name AS author, u.id AS user_id
       FROM statuses s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC
       LIMIT 50`,
    )
    .all();

  res.json({ items: rows, viewerId: req.user.sub });
});

statusesRouter.post('/', (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid status payload', details: parsed.error.errors });
  }

  const result = db
    .prepare('INSERT INTO statuses (user_id, body, mood) VALUES (?, ?, ?)')
    .run(req.user.sub, parsed.data.body, parsed.data.mood);

  const item = db
    .prepare(
      `SELECT s.id, s.body, s.mood, s.created_at, s.updated_at,
              u.display_name AS author, u.id AS user_id
       FROM statuses s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ item });
});

statusesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id, user_id FROM statuses WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ error: 'Status not found' });
  }

  // Ownership check stub — Percy can harden this further.
  if (Number(existing.user_id) !== Number(req.user.sub)) {
    return res.status(403).json({ error: 'You can only delete your own statuses' });
  }

  db.prepare('DELETE FROM statuses WHERE id = ?').run(id);
  res.status(204).end();
});
