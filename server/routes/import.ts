import { Router, Request, Response } from 'express';
import { supabase } from '../supabase.js';
import { requireTeacher } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const storage = multer.memoryStorage();
const uploadOptions: multer.Options = {
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, GIF, WEBP allowed.'));
    }
  }
};

const singleUpload = multer(uploadOptions);
const importUpload = multer(uploadOptions);

const BUCKET_NAME = 'diagrams';

type ImportFiles = {
  file?: Express.Multer.File[];
  diagrams?: Express.Multer.File[];
};

function normalizeDiagramName(filename?: string) {
  return filename ? path.basename(filename).trim().toLowerCase() : '';
}

function buildDiagramStoragePath(subjectCode: string, topic: string, originalName: string) {
  const ext = (path.extname(originalName) || '.png').toLowerCase();
  const safeTopic = (topic || 'diagram')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'diagram';

  return `${subjectCode}/${safeTopic}-${uuidv4()}${ext}`;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET_NAME);
  
  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760
    });
  }
}

router.post('/upload', requireTeacher, singleUpload.single('diagram'), async (req: Request, res: Response) => {
  try {
    await ensureBucketExists();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    res.json({
      success: true,
      url: publicUrl,
      filename
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/import',
  requireTeacher,
  importUpload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'diagrams', maxCount: 200 }
  ]),
  async (req: Request, res: Response) => {
  try {
    await ensureBucketExists();

    const { subject_code } = req.body;
    const files = (req.files || {}) as ImportFiles;
    const questionsFile = files.file?.[0];
    const diagrams = files.diagrams || [];
    
    let questionsData: any;

    if (questionsFile) {
      const isJsonFile = questionsFile.mimetype === 'application/json'
        || questionsFile.originalname.toLowerCase().endsWith('.json');

      if (!isJsonFile) {
        return res.status(400).json({ error: 'The uploaded file must be questions.json' });
      }

      questionsData = JSON.parse(questionsFile.buffer.toString('utf8'));
    }

    if (req.body.questions_json) {
      questionsData = JSON.parse(req.body.questions_json);
    }

    if (!questionsData?.questions) {
      return res.status(400).json({ error: 'questions.json required' });
    }

    const { questions, metadata } = questionsData;
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const q of questions) {
      try {
        const resolvedSubjectCode = q.subject_code || subject_code || metadata?.subject_code;
        if (!resolvedSubjectCode) {
          results.errors.push(`Missing subject_code for question: ${q.question_text?.substring(0, 40) || q.topic}`);
          continue;
        }

        let diagramUrl = q.diagram_url;

        if (q.diagram_filename && diagrams.length > 0) {
          const requestedDiagramName = normalizeDiagramName(q.diagram_filename);
          const diagramFile = diagrams.find((d) => normalizeDiagramName(d.originalname) === requestedDiagramName);

          if (diagramFile) {
            const filename = buildDiagramStoragePath(resolvedSubjectCode, q.topic, diagramFile.originalname);
            
            const { error: uploadError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(filename, diagramFile.buffer, {
                contentType: diagramFile.mimetype,
                upsert: false
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filename);
              diagramUrl = publicUrl;
            }
          } else {
            results.errors.push(`Diagram file not found for ${q.topic}: ${q.diagram_filename}`);
          }
        }

        const existing = await checkDuplicate(q, resolvedSubjectCode);
        if (existing) {
          results.skipped++;
          results.errors.push(`Duplicate: ${q.topic} - ${q.question_text?.substring(0, 30)}`);
          continue;
        }

        const { error } = await supabase
          .from('questions')
          .insert({
            subject_code: resolvedSubjectCode,
            topic: q.topic,
            subtopic: q.subtopic || null,
            question_text: q.question_text,
            question_type: q.question_type,
            options_json: q.options || null,
            correct_answer: q.correct_answer,
            model_answer: q.model_answer,
            explanation_json: parseJsonField(q.explanation, {}),
            key_points_json: parseJsonField(q.key_points, []),
            marks: q.marks || 1,
            diagram_url: diagramUrl || null,
            diagram_type: q.diagram_type || null,
            difficulty: q.difficulty || 1,
            time_estimate: q.time_estimate || 60,
            source: metadata?.generated_by || 'imported'
          });

        if (error) {
          results.errors.push(`Insert error: ${q.topic} - ${error.message}`);
          continue;
        }

        results.imported++;
      } catch (err: any) {
        results.errors.push(`Error: ${q.topic} - ${err.message}`);
      }
    }

    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function checkDuplicate(q: any, subjectCode: string): Promise<boolean> {
  const { data } = await supabase
    .from('questions')
    .select('id')
    .eq('subject_code', q.subject_code || subjectCode)
    .eq('topic', q.topic)
    .eq('question_text', q.question_text)
    .limit(1);

  return (data?.length || 0) > 0;
}

export default router;
