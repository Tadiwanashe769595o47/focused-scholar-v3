export interface StudyNote {
  id: number;
  subject_code: string;
  topic: string;
  subtopic?: string;
  content: string;
  key_terms?: string[];
}

export interface Flashcard {
  id: number;
  subject_code: string;
  topic: string;
  front: string;
  back: string;
}
