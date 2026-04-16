const fs = require('fs');
const path = require('path');

const studyPath = path.join(__dirname, 'src/data/studyContent.ts');
const flashcardsPath = path.join(__dirname, 'src/data/flashcardsContent.ts');

// --- Refactor studyContent.ts ---
let studyContent = fs.readFileSync(studyPath, 'utf8');

// Replace interface and Math+Bio
const studyImports = `import { StudyNote } from '../types/content';
import { biologyNotes } from './subjects/biology_0610';
import { mathsNotes } from './subjects/maths_0580';

export const studyContentData: StudyNote[] = [
  ...mathsNotes,
  ...biologyNotes,`;

// Extract everything from CHEMISTRY down
const chemStudyIndex = studyContent.indexOf('  // CHEMISTRY (0620)');
if (chemStudyIndex !== -1) {
    const keepStudy = studyContent.substring(chemStudyIndex);
    fs.writeFileSync(studyPath, studyImports + '\n' + keepStudy);
    console.log('Successfully updated studyContent.ts');
}

// --- Refactor flashcardsContent.ts ---
let flashContent = fs.readFileSync(flashcardsPath, 'utf8');

const flashImports = `import { Flashcard } from '../types/content';
import { biologyFlashcards } from './subjects/biology_0610';
import { mathsFlashcards } from './subjects/maths_0580';

export const flashcardsData: Flashcard[] = [
  ...mathsFlashcards,
  ...biologyFlashcards,`;

// For flashcards, Math is below Chem. So we need to cut out Bio AND Math individually.
// It's easier to just rebuild it using regex or splitting.
// Let's just grab the chunks:
const chemFlashIndex = flashContent.indexOf('  // CHEMISTRY (0620)');
const mathFlashIndex = flashContent.indexOf('  // MATHEMATICS (0580)');
const compSciFlashIndex = flashContent.indexOf('  // COMPUTER SCIENCE (0478)');

if (chemFlashIndex !== -1 && mathFlashIndex !== -1 && compSciFlashIndex !== -1) {
    // We want to KEEP from Chemistry start to Mathematics start
    const chemistryAndPhysics = flashContent.substring(chemFlashIndex, mathFlashIndex);
    // We want to KEEP from Comp Sci start to the end
    const compSciAndRest = flashContent.substring(compSciFlashIndex);
    
    const finalFlashContent = flashImports + '\n\n' + chemistryAndPhysics + '\n' + compSciAndRest;
    fs.writeFileSync(flashcardsPath, finalFlashContent);
    console.log('Successfully updated flashcardsContent.ts');
}
