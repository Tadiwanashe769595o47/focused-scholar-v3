import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, BookCheck, ChevronLeft, ClipboardList, Printer, TrendingUp,
  AlertTriangle, CheckCircle, Target, Brain, BookOpen, Calendar, Star,
  ArrowDown, ArrowUp, Minus, Lightbulb, Users, Clock
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getRoleHomePath, getUserDisplayName, getViewerStudentId } from '../lib/auth';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';

type LinkedStudent = {
  id: number;
  name: string;
  email?: string | null;
  streak_days?: number;
  total_points?: number;
};

type SubjectScore = {
  subject_code: string;
  subject_name: string;
  total_tests: number;
  total_marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
  trend: 'up' | 'down' | 'stable';
};

type WeakArea = {
  topic: string;
  subject_code: string;
  score_percentage: number;
  times_answered: number;
  times_correct: number;
  suggestion: string;
};

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A*';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
  if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (percentage >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (percentage >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const studentId = getViewerStudentId(user);
  const homePath = getRoleHomePath(user?.type);
  const [loading, setLoading] = useState(true);
  const [linkedStudent, setLinkedStudent] = useState<LinkedStudent | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [holidayWork, setHolidayWork] = useState<any[]>([]);

  useEffect(() => {
    const loadReports = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [studentResponse, statsResponse, historyResponse, homeworkResponse, holidayResponse] = await Promise.all([
          apiFetch('/students/linked'),
          apiFetch(`/students/${studentId}/stats`),
          apiFetch(`/history/${studentId}?limit=100`),
          apiFetch(`/homework/${studentId}`),
          apiFetch(`/holiday/${studentId}`)
        ]);

        setLinkedStudent(studentResponse);
        setStats(statsResponse);
        setHistory(historyResponse || []);
        setHomework(homeworkResponse || []);
        setHolidayWork(holidayResponse || []);
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [studentId]);

  const subjectScores = useMemo(() => {
    const subjectMap = new Map<string, {
      subject_code: string;
      subject_name: string;
      total_tests: number;
      total_marks: number;
      max_marks: number;
      percentages: number[];
    }>();

    history.forEach((entry: any) => {
      const subjectCode = entry.subject_code || 'Unknown';
      const existing = subjectMap.get(subjectCode) || {
        subject_code: subjectCode,
        subject_name: entry.subject_name || subjectCode,
        total_tests: 0,
        total_marks: 0,
        max_marks: 0,
        percentages: [] as number[]
      };

      existing.total_tests += 1;
      existing.total_marks += entry.questions_correct || 0;
      existing.max_marks += entry.total_questions || 0;
      if (entry.score_percentage) {
        existing.percentages.push(Number(entry.score_percentage));
      }

      subjectMap.set(subjectCode, existing);
    });

    const scores: SubjectScore[] = [];
    subjectMap.forEach((data, code) => {
      const percentage = data.max_marks > 0 ? Math.round((data.total_marks / data.max_marks) * 100) : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (data.percentages.length >= 2) {
        const recent = data.percentages[0];
        const older = data.percentages.slice(1).reduce((a, b) => a + b, 0) / (data.percentages.length - 1);
        if (recent > older + 5) trend = 'up';
        else if (recent < older - 5) trend = 'down';
      }

      scores.push({
        subject_code: code,
        subject_name: data.subject_name,
        total_tests: data.total_tests,
        total_marks: data.total_marks,
        max_marks: data.max_marks,
        percentage,
        grade: getGrade(percentage),
        trend
      });
    });

    return scores.sort((a, b) => a.percentage - b.percentage);
  }, [history]);

  const weakAreas = useMemo(() => {
    const topicMap = new Map<string, {
      topic: string;
      subject_code: string;
      times_answered: number;
      times_correct: number;
      score_percentage: number;
    }>();

    history.forEach((entry: any) => {
      if (entry.topic_performance) {
        entry.topic_performance.forEach((tp: any) => {
          const existing = topicMap.get(tp.topic) || {
            topic: tp.topic,
            subject_code: entry.subject_code,
            times_answered: 0,
            times_correct: 0,
            score_percentage: 0
          };
          existing.times_answered += tp.times_answered || 0;
          existing.times_correct += tp.times_correct || 0;
          existing.score_percentage = existing.times_answered > 0 
            ? Math.round((existing.times_correct / existing.times_answered) * 100) 
            : 0;
          topicMap.set(tp.topic, existing);
        });
      }
    });

    const areas: WeakArea[] = [];
    topicMap.forEach((data, topic) => {
      if (data.times_answered < 3) return;
      
      let suggestion = '';
      if (data.score_percentage < 40) {
        suggestion = 'Needs immediate attention - review fundamental concepts';
      } else if (data.score_percentage < 60) {
        suggestion = 'Practice more questions in this topic';
      } else if (data.score_percentage < 75) {
        suggestion = 'Good progress - keep practicing to improve';
      } else {
        suggestion = 'Strong understanding - maintain with occasional review';
      }

      areas.push({
        topic: data.topic,
        subject_code: data.subject_code,
        score_percentage: data.score_percentage,
        times_answered: data.times_answered,
        times_correct: data.times_correct,
        suggestion
      });
    });

    return areas.sort((a, b) => a.score_percentage - b.score_percentage).slice(0, 8);
  }, [history]);

  const overallStats = useMemo(() => {
    if (!history.length) return { average: 0, best: 0, totalTests: 0, totalHours: 0 };
    
    const totalMarks = history.reduce((sum, h) => sum + (h.questions_correct || 0), 0);
    const maxMarks = history.reduce((sum, h) => sum + (h.total_questions || 0), 0);
    const avgPercent = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const bestPercent = Math.max(...history.map(h => h.score_percentage || 0), 0);
    const totalSeconds = history.reduce((sum, h) => sum + (h.time_spent_seconds || 0), 0);
    
    return {
      average: avgPercent,
      best: bestPercent,
      totalTests: history.length,
      totalHours: Math.round(totalSeconds / 3600 * 10) / 10
    };
  }, [history]);

  const openAssignments = useMemo(
    () => [...homework, ...holidayWork].filter((item) => item.status !== 'completed'),
    [holidayWork, homework]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Building report view...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="min-h-screen"
      >
        {/* Header */}
        <header className="glass sticky top-0 z-50 border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(homePath)} 
                  className="p-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Progress Report</h1>
                  <p className="text-sm text-gray-500">
                    {user?.type === 'parent'
                      ? `Performance summary for ${linkedStudent?.name || 'your student'}`
                      : `Your study summary`}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={() => window.print()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-primary border border-gray-200 rounded-full flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print
              </motion.button>
            </div>
          </div>
        </header>

        {/* Official Report Document */}
        <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-2xl p-8 md:p-16 border-t-[16px] border-primary mt-8 mb-20 rounded-b-xl relative">
          
          <div className="absolute top-8 right-8 opacity-10 pointer-events-none">
            <BookCheck className="w-48 h-48 text-primary" />
          </div>

          {/* Official Header */}
          <div className="text-center border-b-2 border-gray-200 pb-8 mb-8 relative z-10">
            <h1 className="text-4xl font-serif font-black text-gray-900 tracking-tight mb-2">FOCUSED SCHOLAR</h1>
            <p className="text-gray-500 font-medium tracking-[0.2em] uppercase text-sm mb-6">Official Academic Progress Report</p>
            
            <div className="flex flex-col md:flex-row justify-between text-left bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase">Student Name</p>
                <p className="text-2xl font-bold text-gray-900">{linkedStudent?.name || user?.email || 'Student'}</p>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-sm font-bold text-gray-400 uppercase">Report Date</p>
                <p className="text-xl font-bold text-gray-900">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-10 relative z-10">
            <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Overall Average</p>
              <p className="text-5xl font-black text-primary">{overallStats.average}%</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Tests Completed</p>
              <p className="text-5xl font-black text-gray-900">{overallStats.totalTests}</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Time Spent</p>
              <p className="text-5xl font-black text-gray-900">{overallStats.totalHours}<span className="text-2xl text-gray-500">h</span></p>
            </div>
          </div>

          {/* Academic Record Table */}
          <div className="mb-12 relative z-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Academic Record
            </h2>
            
            {subjectScores.length === 0 ? (
              <p className="text-gray-500 py-8 italic text-center bg-gray-50 rounded-lg">No academic subjects recorded for this period.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/50">
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b">Subject</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b text-center">Marks Achieved</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b text-center">Final Score</th>
                    <th className="py-4 px-4 font-bold text-gray-600 text-sm border-b text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectScores.map((subject, index) => (
                    <tr key={subject.subject_code} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                      <td className="py-4 px-4 border-b">
                        <div className="font-bold text-gray-900">{subject.subject_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{subject.subject_code}</div>
                      </td>
                      <td className="py-4 px-4 border-b text-center text-gray-700">
                        {subject.total_marks} / {subject.max_marks}
                      </td>
                      <td className="py-4 px-4 border-b text-center">
                        <span className="font-bold text-gray-900">{subject.percentage}%</span>
                      </td>
                      <td className="py-4 px-4 border-b text-center">
                        <span className={`inline-block px-3 py-1 rounded font-bold border ${getGradeColor(subject.percentage)}`}>
                          {subject.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Teacher's Remarks */}
          <div className="mb-16 relative z-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <Brain className="w-5 h-5" /> Teacher's Remarks & Analysis
            </h2>
            
            {overallStats.average >= 80 && (
              <p className="text-gray-700 leading-relaxed mb-6 font-serif italic text-lg">
                "An outstanding academic performance. The student demonstrates excellent comprehension across multiple disciplines and should be highly commended for their diligence. Keep up the phenomenal work!"
              </p>
            )}
            {overallStats.average >= 50 && overallStats.average < 80 && (
              <p className="text-gray-700 leading-relaxed mb-6 font-serif italic text-lg">
                "A solid effort with clear understanding of core concepts. Consistent revision will help elevate these grades to distinction level. Focus on reducing careless errors."
              </p>
            )}
            {overallStats.average > 0 && overallStats.average < 50 && (
              <p className="text-gray-700 leading-relaxed mb-6 font-serif italic text-lg">
                "A more structured revision approach is highly recommended. The student has shown potential but requires targeted practice on fundamental concepts to improve their overall standing."
              </p>
            )}

            {weakAreas.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                <h3 className="font-bold text-orange-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Areas Requiring Immediate Attention
                </h3>
                <ul className="space-y-3">
                  {weakAreas.map((area) => (
                    <li key={area.topic} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0"></div>
                      <div>
                        <span className="font-bold text-gray-900 block">{area.topic} <span className="text-xs text-gray-500 font-normal ml-1">({area.subject_code})</span></span>
                        <span className="text-gray-700 text-sm">Action: {area.suggestion}. Current accuracy is {area.score_percentage}% ({area.times_correct} correct out of {area.times_answered} attempts).</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weakAreas.length === 0 && subjectScores.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                <p className="text-green-800 font-medium">Excellent form displayed. No critical weak areas identified in recently practiced topics.</p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200 mt-12 mb-4 relative z-10">
            <div>
              <div className="h-16 mb-2 flex items-end">
                <span className="font-serif text-3xl text-gray-400 opacity-50 signature-font rotate-[-5deg] block">Focused Scholar AI</span>
              </div>
              <div className="border-t border-black pt-2 w-48">
                <p className="text-xs font-bold text-gray-900 uppercase">System Educator</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="h-16 mb-2"></div>
              <div className="border-t border-black pt-2 w-48 text-right">
                <p className="text-xs font-bold text-gray-900 uppercase">Parent/Guardian Signature</p>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}