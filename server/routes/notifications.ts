import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';

const router = Router();

// Get all notifications for current student
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const student_id = (req as any).user.id;

  // Fetch notifications joined with student_notifications (for read_at)
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      student_notifications!inner(read_at)
    `)
    .eq('student_notifications.student_id', student_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten the response for the frontend
  const notifications = data.map(n => ({
    ...n,
    read_at: n.student_notifications[0]?.read_at
  }));

  res.json(notifications);
});

// Mark a notification as read
router.post('/read/:id', requireAuth, async (req: Request, res: Response) => {
  const student_id = (req as any).user.id;
  const notification_id = req.params.id;

  const { error } = await supabase
    .from('student_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('student_id', student_id)
    .eq('notification_id', notification_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Create a broadcast notification (Teacher only)
router.post('/broadcast', requireTeacher, async (req: Request, res: Response) => {
  const { title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert([{ title, message, type: type || 'info' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  
  // Note: The SQL trigger 'trigger_broadcast_notification' will automatically
  // link this notification to all current students.

  res.json({ success: true, notification: data });
});

export default router;
