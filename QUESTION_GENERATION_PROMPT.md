You are an expert IGCSE examiner and curriculum specialist. Your task is to create a comprehensive question bank from Cambridge IGCSE past papers.

## Requirements:

For each of the following subjects, generate 400 questions with the following structure:

### Subject List:
1. Mathematics (0580)
2. Biology (0610)
3. Chemistry (0620)
4. Physics (0625)
5. Computer Science (0478)
6. Geography (0460)
7. Accounting (0452)
8. Economics (0455)
9. English Language (0500)
10. Business Studies (0450)

### Question Format (JSON):
```json
{
  "questions": [
    {
      "id": 1,
      "subject_code": "0580",
      "topic": "Algebra - Linear Equations",
      "sub_topic": "Solving simple linear equations",
      "difficulty": 1-5,
      "question_type": "multiple_choice",
      "question_text": "The actual question...",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "correct_answer": "A",
      "marks": 1-6,
      "exam_series": "Cambridge 2023",
      "paper": "Paper 2",
      "explanation": "Detailed step-by-step explanation...",
      "exam_tips": "Key things to remember..."
    }
  ]
}
```

### EXPLANATION REQUIREMENTS (CRITICAL):

**3rd Grade Readability:**
- Use simple words (e.g., "add" not "additionally")
- Short sentences (10-15 words max)
- Avoid jargon - if needed, explain any technical terms
- Write for a 12-13 year old student
- Average reading level: elementary/middle school

**Step-by-Step Format:**
- Break solution into numbered steps
- Each step explains ONE action
- Show ALL working, not just the answer
- For math/science: show formulas used and how
- Use bullet points for each step

**Example Good Explanation:**
"To solve 2x + 5 = 15:

1. First, subtract 5 from both sides: 2x = 15 - 5 = 10
2. Then divide both sides by 2: x = 10 ÷ 2 = 5
3. So x = 5"

**Example Bad Explanation (Too Complex):**
"The solution involves isolating the variable through inverse operations..."

### Topic Coverage per Subject:

**Mathematics (0580):**
- Number (60 questions)
- Algebra (100 questions) 
- Geometry (80 questions)
- Statistics (60 questions)
- Probability (40 questions)
- Trigonometry (60 questions)

**Biology (0610):**
- Cells & Transport (40)
- Enzymes & Nutrition (40)
- Respiration & Gas Exchange (40)
- Co-ordination & Homeostasis (40)
- Inheritance & Evolution (60)
- Ecology (60)
- Human Health (40)
- Biochemistry (80)

**Chemistry (0620):**
- States of Matter (30)
- Atomic Structure (40)
- Chemical Bonding (40)
- Chemical Reactions (80)
- Acids & Bases (50)
- Metals (50)
- Organic Chemistry (60)
- Quantitative Chemistry (50)

**Physics (0625):**
- Motion & Forces (50)
- Energy & Work (50)
- Waves & Light (60)
- Electricity (80)
- Magnetism (40)
- Radioactivity (40)
- Thermal Physics (40)
- Space Physics (40)

### Quality Guidelines:
1. Questions from actual Cambridge papers (2020-2024)
2. Include variant questions (same topic, different numbers)
3. Mix of multiple choice, structured, extended response
4. Difficulty: Easy 30%, Medium 40%, Hard 30%
5. Include mark schemes and mark allocation
6. Exam tips in simple language

### Output:
Generate a JSON file for each subject with 400 questions. Ensure:
- All fields populated
- Explanations: 3rd grade readability + step-by-step
- Topics evenly distributed
- Questions progress basic → advanced