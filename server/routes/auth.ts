import { randomBytes } from 'crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { supabase } from '../supabase.js';

const router = Router();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

function validateStudentName(name: string): string | null {
  if (!name || typeof name !== 'string') return 'Name is required';
  if (name.length < 2 || name.length > 50) return 'Name must be 2-50 characters';
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(name)) return 'Name contains invalid characters';
  return null;
}

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

function validateLegacyStudentCredentials(name: string, pin: string): string | null {
  const nameError = validateStudentName(name);
  if (nameError) return nameError;
  if (!pin || typeof pin !== 'string') return 'PIN is required';
  if (pin.length < 4 || pin.length > 8) return 'PIN must be 4-8 characters';
  if (!/^[0-9]+$/.test(pin)) return 'PIN must be numeric';
  return null;
}

function createStudentToken(studentId: number, google = false): string {
  return jwt.sign({ id: studentId, type: 'student', google }, JWT_SECRET, { expiresIn: '7d' });
}

function buildStudentUser(student: any) {
  return {
    id: student.id,
    name: student.name,
    email: student.email || null,
    type: 'student' as const
  };
}

async function touchStudent(studentId: number) {
  await supabase
    .from('students')
    .update({ last_active: new Date().toISOString() })
    .eq('id', studentId);
}

async function findStudentByEmail(email: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

async function createStudentRecord(input: {
  name: string;
  email: string;
  password?: string;
  parent_email?: string | null;
  avatar?: string;
}) {
  const passwordToHash = input.password || randomBytes(12).toString('hex');
  // Generate a random numeric PIN (legacy column, still required by DB schema)
  const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
  const baseInsert = {
    name: input.name,
    email: input.email,
    parent_email: input.parent_email || null,
    avatar: input.avatar || 'default',
    pin: randomPin,
    pin_hash: bcrypt.hashSync(passwordToHash, 10)
  };

  const result = await supabase
    .from('students')
    .insert(baseInsert)
    .select()
    .single();

  return result;
}

function getFrontendUrl() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5173';
  }
  
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl) {
    return envUrl;
  }
  // For packaged Electron app, try to find dist folder relative to server
  const serverDir = __dirname;
  let distPath = serverDir.replace(/\\/g, '/').replace('/dist-server', '');
  return `file://${distPath}/dist/index.html`;
}

function buildGoogleAuthUrl() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return null;
  }

  const scopes = ['email', 'profile'];
  const params = new URLSearchParams();
  params.set('client_id', GOOGLE_CLIENT_ID);
  params.set('redirect_uri', GOOGLE_REDIRECT_URI);
  params.set('response_type', 'code');
  params.set('scope', scopes.join(' '));
  params.set('access_type', 'offline');
  params.set('prompt', 'consent');
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

// Student login
router.post('/student/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password, name, pin } = req.body;
  const normalizedEmail = normalizeEmail(email);

  try {
    if (normalizedEmail) {
      if (!password) return res.status(400).json({ error: 'Password is required' });
      
      const emailError = validateEmail(normalizedEmail);
      if (emailError) return res.status(400).json({ error: emailError });

      const student = await findStudentByEmail(normalizedEmail);
      if (!student) return res.status(401).json({ error: 'No student account found for that email' });

      if (!student.pin_hash || !bcrypt.compareSync(password, student.pin_hash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      await touchStudent(student.id);
      const token = createStudentToken(student.id);
      return res.json({ token, user: buildStudentUser(student) });
    }

    // Legacy fallback (PIN based)
    const validationError = validateLegacyStudentCredentials(name, pin);
    if (validationError) return res.status(400).json({ error: validationError });

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('name', name)
      .single();

    if (error || !student) return res.status(401).json({ error: 'Invalid credentials' });

    if (!student.pin_hash || !bcrypt.compareSync(pin, student.pin_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await touchStudent(student.id);

    const token = createStudentToken(student.id);
    return res.json({ token, user: buildStudentUser(student) });
  } catch (error) {
    console.error('Student login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Student register
router.post('/student/register', loginLimiter, async (req: Request, res: Response) => {
  const { name, email, password, parent_email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedParentEmail = normalizeEmail(parent_email);

  const nameError = validateStudentName(name);
  if (nameError) return res.status(400).json({ error: nameError });

  const emailError = validateEmail(normalizedEmail);
  if (emailError) return res.status(400).json({ error: emailError });

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (normalizedParentEmail) {
    const parentEmailError = validateEmail(normalizedParentEmail, 'Parent email');
    if (parentEmailError) return res.status(400).json({ error: parentEmailError });
  }

  try {
    const existingStudent = await findStudentByEmail(normalizedEmail!);
    if (existingStudent) return res.status(400).json({ error: 'Email already registered' });

    const { data: result, error } = await createStudentRecord({
      name,
      email: normalizedEmail!,
      password: password,
      parent_email: normalizedParentEmail
    });

    if (error || !result) {
      console.error('Student register error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to create account' });
    }

    const token = createStudentToken(result.id);
    return res.json({ token, user: buildStudentUser(result) });
  } catch (error) {
    console.error('Student register error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// Teacher login
router.post('/teacher/login', loginLimiter, async (req: Request, res: Response) => {
  const { username, password, access_code } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length < 2 || username.length > 50) return res.status(400).json({ error: 'Invalid username' });

  const { data: codeSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'TEACHER_ACCESS_CODE')
    .single();

  if (access_code !== codeSetting?.value) return res.status(403).json({ error: 'Invalid access code' });

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: admin.id, type: 'teacher' }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: admin.id, username: admin.username, type: 'teacher' } });
});

// Holiday login
router.post('/holiday/login', loginLimiter, async (req: Request, res: Response) => {
  const { access_code } = req.body;
  if (!access_code || typeof access_code !== 'string') {
    return res.status(400).json({ error: 'Access code required' });
  }

  const { data: codeSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'HOLIDAY_ACCESS_CODE')
    .single();

  if (access_code !== codeSetting?.value) return res.status(403).json({ error: 'Invalid holiday access code' });

  const token = jwt.sign({ type: 'holiday' }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { type: 'holiday' } });
});

// Parent login
router.post('/parent/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  const { data: parent, error } = await supabase
    .from('parents')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !parent || !bcrypt.compareSync(password, parent.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: parent.id, type: 'parent', student_id: parent.student_id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: parent.id, student_id: parent.student_id, type: 'parent' } });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

// ============================================
// GOOGLE OAUTH
// ============================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

router.get('/google/url', (_req: Request, res: Response) => {
  const googleAuthUrl = buildGoogleAuthUrl();

  if (!googleAuthUrl) {
    return res.status(503).json({ error: 'Google login is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to your .env file.' });
  }

  res.json({ url: googleAuthUrl });
});

router.get('/google', (_req: Request, res: Response) => {
  const googleAuthUrl = buildGoogleAuthUrl();

  if (!googleAuthUrl) {
    return res.status(503).json({ error: 'Google login not configured' });
  }

  res.redirect(googleAuthUrl);
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  const frontendUrl = getFrontendUrl();

  if (!code || typeof code !== 'string') {
    return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Google authorization code missing')}`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Google login is not configured yet')}`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenData.access_token) {
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to get Google access token')}`);
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json() as any;
    const { email, name } = googleUser;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Could not get an email from Google')}`);
    }

    let student = await findStudentByEmail(normalizedEmail);

    if (!student) {
      const { data: newStudent, error: createError } = await createStudentRecord({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatar: 'default'
      });

      if (createError || !newStudent) {
        console.error('Google student creation error:', createError);
        return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Failed to create your student account')}`);
      }
      student = newStudent;
    }

    await touchStudent(student.id);

    const jwtToken = createStudentToken(student.id, true);
    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(jwtToken)}`);
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Google authentication failed')}`);
  }
});

router.post('/verify-portal-code', async (req: Request, res: Response) => {
  const { code } = req.body;
  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode) {
    return res.status(400).json({ error: 'Portal code is required' });
  }

  const TEACHER_CODE = process.env.TEACHER_ACCESS_CODE?.toUpperCase() || 'TEACHER123';
  const PARENT_CODE = process.env.PARENT_ACCESS_CODE?.toUpperCase() || 'PARENT123';
  const HOLIDAY_CODE = process.env.HOLIDAY_ACCESS_CODE?.toUpperCase() || 'HOLIDAY123';

  const portalCodes: Record<string, { role: string; redirect: string }> = {
    [TEACHER_CODE]: { role: 'teacher', redirect: '/teacher' },
    [PARENT_CODE]: { role: 'parent', redirect: '/parent' },
    [HOLIDAY_CODE]: { role: 'holiday', redirect: '/holiday' },
  };

  const portalConfig = portalCodes[normalizedCode];
  if (!portalConfig) {
    return res.status(401).json({ error: 'Invalid portal code' });
  }

  res.json({
    message: `Access granted to ${portalConfig.role} portal`,
    redirect: portalConfig.redirect,
    role: portalConfig.role
  });
});

export default router;
