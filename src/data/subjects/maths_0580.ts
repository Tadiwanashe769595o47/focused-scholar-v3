import { StudyNote, Flashcard } from '../../types/content';

export const mathsNotes: StudyNote[] = [
  {
    id: 5001,
    subject_code: '0580',
    topic: 'Number',
    subtopic: 'Directed Numbers & Absolute Variations',
    content: `## 🧭 Mastering Directed Numbers

Directed numbers are numbers that have both a size and a direction (positive or negative). Think of them as walking on an endless road extending left and right from zero.

### 📐 Core Rules
1. **Adding & Subtracting**:
   - $a + b$ (Move right)
   - $a - b$ (Move left)
   - $a + (-b) = a - b$ (Clashing signs become NEGATIVE)
   - $a - (-b) = a + b$ (Clashing double negatives become POSITIVE)

2. **Multiplying & Dividing**:
   - Same signs ALWAYS produce a POSITIVE result: $(+) \\times (+) = (+)$ AND $(-) \\times (-) = (+)$
   - Different signs ALWAYS produce a NEGATIVE result: $(+) \\times (-) = (-)$

### 🧩 Massive Variation Practice

Let's solve through EVERY type of trick examiners use!

**Type 1: Basic Clashing Signs**
- $7 + (-3) \\rightarrow 7 - 3 = 4$
- $-5 - (-2) \\rightarrow -5 + 2 = -3$
- $-8 + (-4) \\rightarrow -8 - 4 = -12$

**Type 2: Multiple Operations (BODMAS applies!)**
*Solve:* $-2 - [4 + (-7)] \\times (-3)$
- Step 1 (Brackets): $4 + (-7) = 4 - 7 = -3$
- Step 2 (Multiply): $-3 \\times -3 = +9$
- Step 3 (Subtract): $-2 - 9 = -11$. **Masterful.**

**Type 3: Fraction Variations**
*Solve:* $\\frac{-15 - (-5)}{-2}$
- Numerator: $-15 + 5 = -10$
- Denominator: $-2$
- Division: $\\frac{-10}{-2} = +5$

**Type 4: Squaring Negatives (TRAP ALERT 🚨)**
- $(-3)^2$ means $(-3) \\times (-3) = +9$
- $-3^2$ means $-(3 \\times 3) = -9$. **The bracket matters!**
`,
    key_terms: ['Directed Numbers', 'BODMAS', 'Absolute Value', 'Integers']
  },
  {
    id: 5002,
    subject_code: '0580',
    topic: 'Algebra',
    subtopic: 'Algebraic Expressions & Expansion',
    content: `## 🏗️ Expanding & Simplifying Algebra

Algebra uses letters (variables) to represent unknown numbers. The golden rule of simplifying is: **You can only add or subtract LIKE TERMS.**

### 1. Simplifying Expressions
> [!TIP]
> Always circle the term **WITH** the sign immediately to its left! 

**Example**: Simplify $3x^2 - 4xy + 2x^2 + 7xy$
- Group $x^2$: $3x^2 + 2x^2 = 5x^2$
- Group $xy$: $-4xy + 7xy = +3xy$
- **Result**: $5x^2 + 3xy$

### 2. Single Bracket Expansion
Multiply the term firmly planted outside by **every single term** inside.
**Variation 1 (Basic)**: $4(2p - 3) = 8p - 12$
**Variation 2 (Negative outside)**: $-3y(y + 2) = -3y^2 - 6y$
**Variation 3 (Complex powers)**: $2x^2(3x - 5x^2) = 6x^3 - 10x^4$

### 3. Double Bracket Expansion (FOIL)
FOIL stands for First, Outer, Inner, Last.

**Variation 1: Standard Positives**
$(x + 3)(x + 4)$
- First: $x \\times x = x^2$
- Outer: $x \\times 4 = 4x$
- Inner: $3 \\times x = 3x$
- Last: $3 \\times 4 = 12$
- Combine: $x^2 + 7x + 12$

**Variation 2: Difference of Two Squares**
$(x - 5)(x + 5)$
- FOIL results in $x^2 + 5x - 5x - 25$. 
- Result: $x^2 - 25$. *(Notice the middle terms violently cancel out!)*

**Variation 3: Perfect Squares**
$(2x - 3)^2$
- DO NOT just square the terms! Rewrite it: $(2x - 3)(2x - 3)$
- $FOIL = 4x^2 - 6x - 6x + 9$
- Result: $4x^2 - 12x + 9$

### 4. Advanced: 3 Brackets Expansion
$(x + 1)(x + 2)(x - 3)$
- **Step 1**: Expand the first two brackets: $(x^2 + 3x + 2)$
- **Step 2**: Multiply that giant result by $(x - 3)$
- $(x^2 + 3x + 2)(x - 3) = x^3 - 3x^2 + 3x^2 - 9x + 2x - 6$
- Result: $x^3 - 7x - 6$`,
    key_terms: ['Algebraic Expression', 'FOIL Method', 'Like Terms', 'Expansion']
  },
  {
    id: 5003,
    subject_code: '0580',
    topic: 'Algebra',
    subtopic: 'Simultaneous Equations Masterclass',
    content: `## 🎯 Defeating Simultaneous Equations

When you have TWO unknown variables (like $x$ and $y$), you absolutely require TWO equations to discover their true value. There are two ultimate methods to solve them.

### Method 1: Elimination (The "Destroyer" Method)
Use this when equations are stacked neatly: $ax + by = c$

**Problem:** 
1) $3x + 2y = 16$
2) $2x - 2y = 4$

**Step-by-step Solution:**
1. Look at the $y$ terms. We have $+2y$ and $-2y$. They are perfectly balanced for destruction!
2. Add Equation 1 to Equation 2 vertically:
   $(3x + 2x) + (2y - 2y) = (16 + 4)$
   $5x = 20$
3. Solve for x: $x = 4$
4. Substitute $x=4$ back into Equation 1:
   $3(4) + 2y = 16 \\rightarrow 12 + 2y = 16 \\rightarrow 2y = 4 \\rightarrow y = 2$
- **Final Answer**: $x = 4, y = 2$

**Variation: Unequal coefficients**
1) $2x + 3y = 8$
2) $3x - y = 23$
- **Strategy**: Multiply Eq 2 by 3 to force the $y$ values to match ($3y$ and $-3y$). Then ADD them together to eliminate!

### Method 2: Substitution (The "Infiltration" Method)
Use this when one equation already has $x$ or $y$ completely isolated by itself.

**Problem:**
1) $y = 2x - 1$
2) $3x + 2y = 12$

**Step-by-step Solution:**
1. Take the entire expression for $y$ from Eq 1, and violently shove it into Eq 2 wherever you see a 'y'.
2. $3x + 2(2x - 1) = 12$
3. Expand brackets: $3x + 4x - 2 = 12$
4. Simplify: $7x - 2 = 12 \\rightarrow 7x = 14 \\rightarrow x = 2$
5. Sub $x=2$ back into Eq 1: $y = 2(2) - 1 = 3$
- **Final Answer**: $x = 2, y = 3$

> [!CAUTION]
> If you are solving a quadratic simultaneous equation (where an $x^2$ or $y^2$ exists), you MUST use the Substitution method! Elimination will fatally fail.`,
    key_terms: ['Simultaneous Equation', 'Elimination', 'Substitution', 'Variable Isolation']
  },
  {
    id: 5004,
    subject_code: '0580',
    topic: 'Number',
    subtopic: 'Standard Form & Estimation',
    content: `## 🌌 Standard Form & Estimation

Scientists use Standard Form to write horrifyingly massive numbers (distance to stars) or microscopic numbers (size of atoms). 

### The Law of Standard Form
Must be written exactly as: **$A \\times 10^n$**
- **$A$** MUST be a number between $1$ and less than $10$ (e.g. 5.6 is fine, 12.3 is NOT, 0.9 is NOT).
- **$n$** MUST be an integer (a whole number).

### Conversion Drills
**Large Numbers:** Count how many places you move the decimal point LEFT.
- $45,000 \\rightarrow 4.5 \\times 10^4$
- $3,000,000 \\rightarrow 3.0 \\times 10^6$

**Small Numbers:** Count how many places you move the decimal point RIGHT. This makes 'n' negative!
- $0.000078 \\rightarrow 7.8 \\times 10^{-5}$
- $0.002 \\rightarrow 2.0 \\times 10^{-3}$

### Operations with Standard Form
**Multiplication Variation:** $(3 \\times 10^4) \\times (2 \\times 10^5)$
1. Multiply the normal numbers: $3 \\times 2 = 6$
2. Add the power indices: $4 + 5 = 9$
3. Answer: $6 \\times 10^9$

**Addition Variation (Tricky!):** $(4 \\times 10^5) + (3 \\times 10^4)$
- You CANNOT just add them because the powers are different.
- Convert them to ordinary numbers: $400,000 + 30,000 = 430,000$.
- Convert back: $4.3 \\times 10^5$.

---

### ⏱️ Upper and Lower Bounds

When a dimension is rounded, it has a hidden error margin!
- If a length is $15cm$ to the nearest $cm$, it could actually be anything from $14.5cm$ (Lower Bound) up to $15.499...cm$ (Upper Bound, written as $15.5cm$).

**Formula to find Bounds:**
1. Identify the degree of accuracy (e.g., "nearest 10", "nearest 0.1").
2. Divide that accuracy by 2. This is your Error Margin.
3. Upper Bound = Actual Value + Error Margin.
4. Lower Bound = Actual Value - Error Margin.

**Extreme Variation: Area Calculation**
A rectangle has length $10cm$ (nearest cm) and width $5cm$ (nearest cm). Find the Upper Bound of its Area!
- Length Upper Bound: $10.5cm$
- Width Upper Bound: $5.5cm$
- Area UB: $10.5 \\times 5.5 = 57.75 cm^2$ (NEVER multiply the base rounded values first!)`,
    key_terms: ['Standard Form', 'Scientific Notation', 'Significant Figures', 'Upper Bound', 'Lower Bound']
  }
];

export const mathsFlashcards: Flashcard[] = [
  // Numbers & Bounds
  { id: 50001, subject_code: '0580', topic: 'Number', front: 'What is the absolute strict rule for the "A" part in Standard Form (A x 10^n)?', back: 'A must be greater than or equal to 1, and strictly less than 10. (1 <= A < 10).' },
  { id: 50002, subject_code: '0580', topic: 'Number', front: 'If a weight is 45kg to the nearest kg, what are its upper and lower bounds?', back: 'Lower Bound = 44.5kg. Upper Bound = 45.5kg. (Error interval: 44.5 <= w < 45.5).' },
  { id: 50003, subject_code: '0580', topic: 'Number', front: 'To calculate the MAXIMUM possible perimeter of a field with rounded dimensions, what bounds do you use?', back: 'You must add together the UPPER BOUNDS of all individual sides.' },
  { id: 50004, subject_code: '0580', topic: 'Number', front: 'Simplify: -5 - (-3)', back: 'Double negative turns into a positive. So -5 + 3 = -2.' },
  { id: 50005, subject_code: '0580', topic: 'Number', front: 'Calculate (-4)^2 vs -4^2', back: '(-4)^2 = 16. But -4^2 = -16 (only the 4 is squared without brackets!).' },
  // Algebra Expansion
  { id: 50006, subject_code: '0580', topic: 'Algebra', front: 'Expand and simplify: (x - 6)(x + 6)', back: 'This is the Difference of Two Squares! x^2 + 6x - 6x - 36. Result: x^2 - 36.' },
  { id: 50007, subject_code: '0580', topic: 'Algebra', front: 'What is the mistake in saying (x + 3)^2 = x^2 + 9?', back: 'You missed the FOIL cross multiplication! It should be (x+3)(x+3) = x^2 + 3x + 3x + 9 = x^2 + 6x + 9.' },
  { id: 50008, subject_code: '0580', topic: 'Algebra', front: 'Expand: -2xy(3x - 4y)', back: 'Multiply out: -6x^2y + 8xy^2. (Watch out for the signs flipping!)' },
  { id: 50009, subject_code: '0580', topic: 'Algebra', front: 'What does expanding 3 brackets (x+1)(x+2)(x+3) ultimately yield as the highest power?', back: 'An x^3 (cubic) term.' },
  // Simultaneous Eq
  { id: 50010, subject_code: '0580', topic: 'Algebra', front: 'When solving simultaneous equations using the elimination method, what must you do if the coefficients of x or y don\'t match?', back: 'Multiply one or both entire equations by a constant scalar until one set of variables has matching (or inversely matching) coefficients.' },
  { id: 50011, subject_code: '0580', topic: 'Algebra', front: 'When should you prioritize the Substitution Method over the Elimination Method?', back: 'Whenever an equation is already rearranged to make an unknown the subject (e.g., y = 2x + 1), or when dealing with quadratic/nonlinear simultaneous equations.' },
  { id: 50012, subject_code: '0580', topic: 'Algebra', front: 'Solve simultaneously quickly: x + y = 10, x - y = 4', back: 'Add them: 2x = 14, x = 7. Sub back in: 7 + y = 10, y = 3.' }
];
