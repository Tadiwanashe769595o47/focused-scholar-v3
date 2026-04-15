import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function normalizeEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function validateEmail(email: string | null, label = 'Email'): string | null {
  if (!email) return `${label} is required`;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return `Invalid ${label.toLowerCase()} format`;
  return null;
}

function getLinkedStudentId(req: Request): number | null {
  if (req.user?.type === 'student') return req.user.id;
  if (req.user?.type === 'parent') return req.user.student_id || null;
  return null;
}

// Get current student profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { data: student, error } = await supabase
    .from('students')
    .select('id, name, email, avatar, streak_days, total_points, font_size, parent_email')
    .eq('id', req.user.id)
    .single();

  if (error || !student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

// Get the currently linked student for student and parent views
router.get('/linked', requireAuth, async (req: Request, res: Response) => {
  const studentId = getLinkedStudentId(req);
  if (!studentId) return res.status(403).json({ error: 'Student access required' });

  const { data: student, error } = await supabase
    .from('students')
    .select('id, name, email, avatar, streak_days, total_points, font_size, parent_email, last_active')
    .eq('id', studentId)
    .single();

  if (error || !student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

// Update student preferences
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const { name, email, font_size, parent_email, avatar } = req.body;
  const updates: any = {};
  const normalizedEmail = email !== undefined ? normalizeEmail(email) : undefined;
  const normalizedParentEmail = parent_email !== undefined ? normalizeEmail(parent_email) : undefined;

  if (normalizedEmail !== undefined) {
    const emailError = validateEmail(normalizedEmail);
    if (emailError) return res.status(400).json({ error: emailError });

    const { data: existingStudent, error: existingStudentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', normalizedEmail)
      .neq('id', req.user.id)
      .maybeSingle();

    if (existingStudentError && existingStudentError.code !== 'PGRST116') {
      return res.status(500).json({ error: existingStudentError.message });
    }

    if (existingStudent) {
      return res.status(400).json({ error: 'Email already registered to another student' });
    }

    updates.email = normalizedEmail;
  }

  if (font_size) updates.font_size = font_size;
  if (normalizedParentEmail !== undefined) {
    if (normalizedParentEmail) {
      const parentEmailError = validateEmail(normalizedParentEmail, 'Parent email');
      if (parentEmailError) return res.status(400).json({ error: parentEmailError });
    }

    updates.parent_email = normalizedParentEmail;
  }
  if (avatar) updates.avatar = avatar;
  if (name) updates.name = name;

  const { error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Get student progress (subjects list with today's status)
router.get('/:id/progress', requireAuth, async (req: Request, res: Response) => {
  const studentId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  // Fetch all subjects
  const { data: allSubjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('code, name, icon, color')
    .order('display_order');

  if (subjectsError) return res.status(500).json({ error: subjectsError.message });

  // Fetch today's tests for this student
  const { data: todayTests } = await supabase
    .from('daily_tests')
    .select('subject_code, status, current_index, questions_json')
    .eq('student_id', studentId)
    .eq('date', today);

  const todayTestMap = new Map(todayTests?.map((t: any) => [t.subject_code, t]));

  // Fetch overall progress per subject (total correct / total answered)
  const { data: topicProgress } = await supabase
    .from('topic_progress')
    .select('subject_code, times_answered, times_correct')
    .eq('student_id', studentId);

  const subjectProgressMap = new Map<string, { answered: number; correct: number }>();
  topicProgress?.forEach((tp: any) => {
    const existing = subjectProgressMap.get(tp.subject_code) || { answered: 0, correct: 0 };
    subjectProgressMap.set(tp.subject_code, {
      answered: existing.answered + tp.times_answered,
      correct: existing.correct + tp.times_correct
    });
  });

  const subjects = (allSubjects || []).map((sub: any) => {
    const todayTest = todayTestMap.get(sub.code);
    const prog = subjectProgressMap.get(sub.code);

    let todayStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (todayTest) {
      if (todayTest.status === 'completed') {
        todayStatus = 'completed';
      } else if ((todayTest.current_index || 0) > 0) {
        todayStatus = 'in_progress';
      }
    }

    const progress = prog && prog.answered > 0
      ? Math.round((prog.correct / prog.answered) * 100)
      : 0;

    return {
      code: sub.code,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      progress,
      todayStatus
    };
  });

  res.json({ subjects });
});

// Get student badges
router.get('/:id/badges', requireAuth, async (req: Request, res: Response) => {
  const { data: badges, error } = await supabase
    .from('student_badges')
    .select('badges (*), earned_at')
    .eq('student_id', req.params.id)
    .order('earned_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(badges);
});

// Get student stats
router.get('/:id/stats', requireAuth, async (req: Request, res: Response) => {
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', req.params.id)
    .single();

  const { data: recent } = await supabase
    .from('student_history')
    .select('date, total_questions, questions_correct, score_percentage, time_spent_seconds')
    .eq('student_id', req.params.id)
    .order('date', { ascending: false })
    .limit(30);

  const { data: today } = await supabase
    .from('student_history')
    .select('total_questions, questions_correct')
    .eq('student_id', req.params.id)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();

  res.json({ 
    streak: student?.streak_days, 
    points: student?.total_points, 
    recent_history: recent, 
    today 
  });
});

// Get student profile (for onboarding check)
router.get('/me/profile', requireAuth, async (req: Request, res: Response) => {
  const { data: profile, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('student_id', req.user.id)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json(profile || { completed_onboarding: false });
});

// Create/update student profile (onboarding)
router.post('/me/profile', requireAuth, async (req: Request, res: Response) => {
  const {
    grade,
    school,
    target_grade,
    study_hours_per_week,
    weakest_subject,
    learning_style,
    exam_year,
    subjects,
    completed_onboarding
  } = req.body;

  const { data: existing } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('student_id', req.user.id)
    .single();

  const profileData = {
    student_id: req.user.id,
    grade: grade || null,
    school: school || null,
    target_grade: target_grade || null,
    exam_board: 'Cambridge',
    study_hours_per_week: study_hours_per_week || null,
    weakest_subject: weakest_subject || null,
    learning_style: learning_style || null,
    exam_year: exam_year || 2027,
    goals_json: { subjects: subjects || [] },
    completed_onboarding: completed_onboarding !== undefined ? completed_onboarding : true,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing) {
    result = await supabase
      .from('student_profiles')
      .update(profileData)
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('student_profiles')
      .insert(profileData)
      .select()
      .single();
  }

  if (result.error) return res.status(500).json({ error: result.error.message });
  res.json(result.data);
});

export default router;
