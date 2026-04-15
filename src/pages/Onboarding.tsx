import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { useToastStore } from '../stores/toastStore';
import LoadingOverlay from '../components/LoadingOverlay';
import { ChevronRight, ChevronLeft, GraduationCap, BookOpen, Target, Clock, Trophy } from 'lucide-react';

const GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'O Level'];
const TARGET_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'];
const SUBJECTS = [
  { code: '0580', name: 'Mathematics', color: '#6366F1' },
  { code: '0610', name: 'Biology', color: '#10B981' },
  { code: '0620', name: 'Chemistry', color: '#F59E0B' },
  { code: '0625', name: 'Physics', color: '#EF4444' },
  { code: '0478', name: 'Computer Science', color: '#8B5CF6' },
  { code: '0460', name: 'Geography', color: '#06B6D4' },
  { code: '0452', name: 'Accounting', color: '#14B8A6' },
  { code: '0455', name: 'Economics', color: '#F97316' },
  { code: '0500', name: 'English Language', color: '#EC4899' },
  { code: '0510', name: 'English Literature', color: '#D946EF' }
];
const STUDY_HOURS = ['Less than 3', '3-5', '6-8', '9-12', '12+'];
const LEARNING_STYLES = ['Visual (diagrams, charts)', 'Reading/Writing (notes, textbooks)', 'Hands-on (practice questions)', 'Mixed (all of the above)'];
const EXAM_YEARS = [2026, 2027, 2028, 2029];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, logout, setNeedsOnboarding } = useAuthStore();
  const { addToast } = useToastStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    grade: '',
    school: '',
    targetGrade: '',
    studyHours: '',
    weakestSubject: '',
    learningStyle: '',
    examYear: 2027,
    subjects: [] as string[]
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiFetch('/students/me/profile', {
        method: 'POST',
        body: JSON.stringify({
          grade: formData.grade,
          school: formData.school,
          target_grade: formData.targetGrade,
          study_hours_per_week: parseInt(formData.studyHours.split('-')[0] || '3'),
          weakest_subject: formData.weakestSubject,
          learning_style: formData.learningStyle,
          exam_year: formData.examYear,
          subjects: formData.subjects,
          completed_onboarding: true
        })
      });

      addToast('Profile created! Welcome to Focused Scholar.', 'success');
      setNeedsOnboarding(false);
      navigate('/dashboard');
    } catch (err: any) {
      addToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (code: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(code)
        ? prev.subjects.filter(s => s !== code)
        : [...prev.subjects, code]
    }));
  };

  const steps = [
    // Step 1: Grade & School
    <div key="step1" className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <GraduationCap className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Tell us about your studies</h2>
        <p className="text-gray-500 mt-2">We'll customize your learning experience</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Grade / Year</label>
        <div className="grid grid-cols-3 gap-2">
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => setFormData(prev => ({ ...prev, grade: g }))}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.grade === g
                  ? 'border-primary bg-indigo-50 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School Name (Optional)</label>
        <input
          type="text"
          value={formData.school}
          onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
          placeholder="Your school name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Year</label>
        <div className="grid grid-cols-4 gap-2">
          {EXAM_YEARS.map(y => (
            <button
              key={y}
              onClick={() => setFormData(prev => ({ ...prev, examYear: y }))}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.examYear === y
                  ? 'border-primary bg-indigo-50 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 2: Subjects
    <div key="step2" className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <BookOpen className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Which subjects are you taking?</h2>
        <p className="text-gray-500 mt-2">Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUBJECTS.map(subject => (
          <button
            key={subject.code}
            onClick={() => toggleSubject(subject.code)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.subjects.includes(subject.code)
                ? 'border-primary bg-indigo-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ borderLeftColor: formData.subjects.includes(subject.code) ? subject.color : undefined, borderLeftWidth: formData.subjects.includes(subject.code) ? 4 : 2 }}
          >
            <p className="font-semibold text-gray-900">{subject.name}</p>
            <p className="text-xs text-gray-500">{subject.code}</p>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Goals
    <div key="step3" className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Target className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">What's your target grade?</h2>
        <p className="text-gray-500 mt-2">We'll help you get there</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Grade</label>
        <div className="grid grid-cols-6 gap-2">
          {TARGET_GRADES.map(g => (
            <button
              key={g}
              onClick={() => setFormData(prev => ({ ...prev, targetGrade: g }))}
              className={`p-4 rounded-lg border-2 text-lg font-bold transition-all ${
                formData.targetGrade === g
                  ? g === 'A*' || g === 'A'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : g === 'B' || g === 'C'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your weakest subject (if any)</label>
        <select
          value={formData.weakestSubject}
          onChange={(e) => setFormData(prev => ({ ...prev, weakestSubject: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="">None - all good!</option>
          {SUBJECTS.map(s => (
            <option key={s.code} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>,

    // Step 4: Study Habits
    <div key="step4" className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Clock className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">How do you study?</h2>
        <p className="text-gray-500 mt-2">We'll optimize your schedule</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Study hours per week</label>
        <div className="grid grid-cols-5 gap-2">
          {STUDY_HOURS.map(h => (
            <button
              key={h}
              onClick={() => setFormData(prev => ({ ...prev, studyHours: h }))}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.studyHours === h
                  ? 'border-primary bg-indigo-50 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Learning style</label>
        <div className="space-y-2">
          {LEARNING_STYLES.map(style => (
            <button
              key={style}
              onClick={() => setFormData(prev => ({ ...prev, learningStyle: style }))}
              className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                formData.learningStyle === style
                  ? 'border-primary bg-indigo-50 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 5: Summary
    <div key="step5" className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
        <p className="text-gray-500 mt-2">Review your profile summary</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Grade</p>
            <p className="font-semibold">{formData.grade || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target</p>
            <p className="font-semibold">{formData.targetGrade || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Subjects</p>
            <p className="font-semibold">{formData.subjects.length} selected</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Study Hours</p>
            <p className="font-semibold">{formData.studyHours || 'Not set'}</p>
          </div>
        </div>

        {formData.school && (
          <div>
            <p className="text-sm text-gray-500">School</p>
            <p className="font-semibold">{formData.school}</p>
          </div>
        )}

        {formData.weakestSubject && (
          <div>
            <p className="text-sm text-gray-500">Focus Area</p>
            <p className="font-semibold text-red-600">{formData.weakestSubject}</p>
          </div>
        )}
      </div>
    </div>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {loading && <LoadingOverlay message="Setting up your profile..." />}

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {steps[step]}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={step === 0 ? () => { logout(); navigate('/login'); } : handleBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Logout' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark flex items-center gap-2 btn-press"
          >
            {step === totalSteps - 1 ? 'Start Learning' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          You can update these anytime in Settings
        </p>
      </div>
    </div>
  );
}
