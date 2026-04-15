import { supabase } from '../supabase.js';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  console.log('Checking Supabase connection...');

  try {
    // Check subjects exist
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      console.error('Tables do not exist. Please run the SQL schema in Supabase SQL Editor:');
      console.error('https://app.supabase.com/project/bpvwkmkwecjqwjyvtzuh/sql');
      console.error('Copy the contents of server/supabase-schema.sql and run it there.');
      return;
    }

    if (subjects && subjects.length > 0) {
      console.log(`Database connected. Found ${subjects.length} subjects.`);
    } else {
      console.log('Database connected but no subjects found. Seeding...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

async function seedDatabase() {
  // Insert subjects
  const subjects = [
    { code: '0580', name: 'Mathematics', icon: 'calculator', color: '#6366F1', display_order: 1 },
    { code: '0610', name: 'Biology', icon: 'leaf', color: '#10B981', display_order: 2 },
    { code: '0620', name: 'Chemistry', icon: 'flask', color: '#F59E0B', display_order: 3 },
    { code: '0625', name: 'Physics', icon: 'zap', color: '#EF4444', display_order: 4 },
    { code: '0478', name: 'Computer Science', icon: 'code', color: '#8B5CF6', display_order: 5 },
    { code: '0460', name: 'Geography', icon: 'globe', color: '#06B6D4', display_order: 6 },
    { code: '0452', name: 'Accounting', icon: 'dollar-sign', color: '#14B8A6', display_order: 7 },
    { code: '0455', name: 'Economics', icon: 'trending-up', color: '#F97316', display_order: 8 },
    { code: '0500', name: 'English Lang', icon: 'book-open', color: '#EC4899', display_order: 9 },
    { code: '0510', name: 'English Lit', icon: 'feather', color: '#D946EF', display_order: 10 }
  ];

  const { error: subjectsError } = await supabase
    .from('subjects')
    .upsert(subjects, { onConflict: 'code' });

  if (subjectsError) {
    console.error('Error seeding subjects:', subjectsError);
  } else {
    console.log('Seeded 10 subjects');
  }

  // Insert badges
  const badges = [
    { name: 'First Step', description: 'Complete your first subject', icon: 'star', points: 50, category: 'milestone' },
    { name: 'Perfect Score', description: 'Get 100% in any subject', icon: 'target', points: 100, category: 'achievement' },
    { name: 'Bookworm', description: 'Complete all 10 subjects', icon: 'book', points: 200, category: 'milestone' },
    { name: 'On Fire', description: '7-day streak', icon: 'flame', points: 150, category: 'streak' },
    { name: 'Champion', description: '30-day streak', icon: 'trophy', points: 500, category: 'streak' },
    { name: 'King', description: '100-day streak', icon: 'crown', points: 1000, category: 'streak' },
    { name: 'Quick Learner', description: 'Finish in under 30 min', icon: 'zap', points: 75, category: 'speed' },
    { name: 'Brain Power', description: '50% retry questions correct', icon: 'brain', points: 100, category: 'improvement' },
    { name: 'Reading Star', description: 'Complete English', icon: 'glasses', points: 100, category: 'subject' },
    { name: 'Scientist', description: 'Complete all sciences', icon: 'flask', points: 150, category: 'subject' }
  ];

  const { error: badgesError } = await supabase
    .from('badges')
    .upsert(badges, { onConflict: 'name' });

  if (badgesError) {
    console.error('Error seeding badges:', badgesError);
  } else {
    console.log('Seeded 10 badges');
  }

  // Insert settings
  const settings = [
    { key: 'TEACHER_ACCESS_CODE', value: '123456' },
    { key: 'HOLIDAY_ACCESS_CODE', value: '789012' },
    { key: 'PARENT_ACCESS_CODE', value: 'parent123' },
    { key: 'DAILY_TEST_GENERATION_TIME', value: '00:00' }
  ];

  for (const setting of settings) {
    const { error } = await supabase
      .from('settings')
      .upsert(setting, { onConflict: 'key' });
    if (error) {
      console.error(`Error seeding setting ${setting.key}:`, error);
    }
  }
  console.log('Seeded settings');

  // Create default teacher admin
  const teacherAccessCode = process.env.TEACHER_ACCESS_CODE || '123456';
  const passwordHash = bcrypt.hashSync('teacher123', 10);
  const { error: adminError } = await supabase
    .from('admins')
    .upsert({ username: 'teacher', password_hash: passwordHash, role: 'teacher', access_code: teacherAccessCode }, { onConflict: 'username' });

  if (adminError) {
    console.error('Error seeding admin:', adminError);
  } else {
    console.log('Created default teacher account (username: teacher, password: teacher123)');
  }
}
