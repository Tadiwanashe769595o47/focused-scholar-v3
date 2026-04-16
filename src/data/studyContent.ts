export interface StudyNote {
  id: number;
  subject_code: string;
  topic: string;
  subtopic?: string;
  content: string;
  key_terms?: string[];
}

export const studyContentData: StudyNote[] = [
  // MATHEMATICS (0580)
  {
    id: 1,
    subject_code: '0580',
    topic: 'Number Operations',
    subtopic: 'Directed Numbers',
    content: `## 🎯 Mastering Directed Numbers

Directed numbers are positive and negative numbers that show direction or position on a scale. Think of them like a thermometer - above zero is positive, below zero is negative!

### The Rules

**Addition & Subtraction:**
- Add a positive → move RIGHT on the number line
- Add a negative → move LEFT on the number line
- Two signs together? → Add them! (++ = +, -- = +, +- = -, -+ = -)

**Multiplication:**
- Positive × Positive = POSITIVE ✓
- Negative × Negative = POSITIVE ✓
- Positive × Negative = NEGATIVE
- Negative × Positive = NEGATIVE

**Division:**
- Same rules as multiplication!

### 💡 Quick Remember:
> **"Same signs = Positive, Different signs = Negative!"**

### 🎮 Practice Example:
What is (-3) + (+7)?
→ Start at -3, move +7 right → Answer: +4! 🎉`,
    key_terms: ['Directed Numbers', 'Positive', 'Negative', 'Integer']
  },
  {
    id: 2,
    subject_code: '0580',
    topic: 'Algebra',
    subtopic: 'Simplifying Expressions',
    content: `## 🔤 Simplifying Algebra

Algebra is like a puzzle game! We use letters (like x, y) to represent unknown numbers.

### The Golden Rule
**"Combine like terms!"**

### Examples

**Example 1:** 3x + 2y - x + 5y
- Combine x terms: 3x - x = 2x
- Combine y terms: 2y + 5y = 7y
- **Answer: 2x + 7y** ✓

**Example 2:** 4a - 3b + 2a - a = 5a - 3b

### 🎯 Pro Tip
Always look for terms with the SAME letter!`,
    key_terms: ['Variable', 'Expression', 'Like Terms', 'Coefficient']
  },
  {
    id: 3,
    subject_code: '0580',
    topic: 'Algebra',
    subtopic: 'Expanding Brackets',
    content: `## 📦 Expanding Brackets

Removing brackets is like unwrapping a gift!

### Single Brackets
3(2x - 5) means 3 × (2x - 5)
- 3 × 2x = 6x
- 3 × (-5) = -15
- **Answer: 6x - 15** 🎉

### Double Brackets - FOIL Method
(x + 2)(x - 3)

**F** = First: x × x = x²
**O** = Outside: x × (-3) = -3x
**I** = Inside: 2 × x = 2x
**L** = Last: 2 × (-3) = -6

Combine: x² - 3x + 2x - 6 = **x² - x - 6** ✓

### 🎮 Try It:
(x + 4)(x - 2) = x² + 2x - 8`,
    key_terms: ['Expand', 'Factorise', 'FOIL']
  },
  {
    id: 4,
    subject_code: '0580',
    topic: 'Algebra',
    subtopic: 'Linear Equations',
    content: `## ⚖️ Solving Linear Equations

An equation is like a balanced scale - what you do to one side, you must do to the other!

### The Goal
Get the letter (unknown) ALONE on one side!

### Steps
1. Expand any brackets
2. Collect like terms on each side
3. Move the variable to one side
4. Divide or multiply to solve

### Example
Solve: 3x + 7 = 22

Step 1: 3x + 7 - 7 = 22 - 7
Step 2: 3x = 15
Step 3: 3x ÷ 3 = 15 ÷ 3
Step 4: **x = 5** 🎉

### Practice
2x - 4 = 10 → 2x = 14 → x = 7 ✓`,
    key_terms: ['Equation', 'Solution', 'Variable']
  },
  {
    id: 5,
    subject_code: '0580',
    topic: 'Algebra',
    subtopic: 'Indices & Powers',
    content: `## 🔢 Indices & Powers

Indices (or powers) show how many times to multiply a number by itself.

### Understanding Indices
2³ = 2 × 2 × 2 = 8
- 2 is the **base**
- 3 is the **index** (power)
- 8 is the **value**

### The Magic Rules

**Rule 1: Multiplying**
aᵐ × aⁿ = aᵐ���ⁿ
Example: 2² × 2³ = 2⁵ = 32 ✓

**Rule 2: Dividing**
aᵐ ÷ aⁿ = aᵐ⁻ⁿ
Example: 2⁵ ÷ 2² = 2³ = 8 ✓

**Rule 3: Power of a Power**
(aᵐ)ⁿ = aᵐⁿ
Example: (2²)³ = 2⁶ = 64 ✓

**Rule 4: Zero Power**
a⁰ = 1 (anything to power 0 = 1!)

**Rule 5: Negative Power**
a⁻ⁿ = 1/aⁿ
Example: 2⁻³ = 1/2³ = 1/8 ✓`,
    key_terms: ['Index', 'Power', 'Base', 'Exponent']
  },
  {
    id: 6,
    subject_code: '0580',
    topic: 'Geometry',
    subtopic: 'Angles',
    content: `## 📐 Angle Facts

Angles are everywhere! Let's master them!

### Key Angle Rules

**Angles on a straight line = 180°**
**Angles around a point = 360°**
**Angles in a triangle = 180°**
**Vertically opposite angles are equal**

### Types of Angles
- **Acute:** 0° - 90° (small!)
- **Right:** exactly 90°
- **Obtuse:** 90° - 180°
- **Straight:** 180°
- **Reflex:** 180° - 360°

### Remember
> **"A RAT in the triangle"**
> - **A**cute
> - **R**ight  
> - **T**an (Obtuse!)

### Parallel Line Rules
- Corresponding angles equal
- Alternate angles equal
- Co-interior angles add to 180°`,
    key_terms: ['Acute', 'Obtuse', 'Reflex', 'Complementary']
  },
  // BIOLOGY (0610)
  {
    id: 101,
    subject_code: '0610',
    topic: 'Life Processes',
    subtopic: 'MRS GREN',
    content: `## 🌟 What Makes Something ALIVE?

All living things perform these 7 special activities! Memory trick: **MRS GREN**

### The 7 Life Processes

**M**ovement - Moving part of the body or the whole organism
**R**espiration - Breaking down food to release energy
**S**ensitivity - Responding to changes in the environment
**G**rowth - Increasing in size
**R**eproduction - Making new offspring
**E**cretion - Getting rid of waste products
**N**utrition - Taking in and using food

### 💡 Quick Check
Is fire alive? ❌
It uses oxygen, produces heat, but it doesn't eat, grow, or reproduce!

Is a car alive? ❌
It needs fuel but doesn't make waste!`,
    key_terms: ['MRS GREN', 'Life Processes', 'Nutrition']
  },
  {
    id: 102,
    subject_code: '0610',
    topic: 'Cell Biology',
    subtopic: 'Cell Membrane Transport',
    content: `## 🚚 Cell Transport

Cells need to move materials in and out! Here's how:

### 1. Diffusion
Movement from HIGH to LOW concentration - No energy needed!
- Like perfume spreading in a room

### 2. Osmosis
Special diffusion through a MEMBRANE - Water moves from HIGH to LOW!
- Water moving between plant cells

### 3. Active Transport
Movement from LOW to HIGH concentration - ENERGY needed!
- Sugar moving INTO cells

### Comparison

| Process | Direction | Energy? |
|---------|-----------|---------|
| Diffusion | High → Low | No |
| Osmosis | High → Low | No |
| Active | Low → High | Yes |`,
    key_terms: ['Diffusion', 'Osmosis', 'Active Transport']
  },
  {
    id: 103,
    subject_code: '0610',
    topic: 'Biological Molecules',
    subtopic: 'Carbohydrates',
    content: `## 🍬 Carbohydrates

Carbs give us QUICK energy!

### Three Types

**1. Simple Sugars (Monosaccharides)**
- One unit - super sweet!
- Examples: Glucose, Fructose

**2. Disaccharides**
- Two units joined together
- Examples: Sucrose (table sugar)

**3. Complex Carbs (Polysaccharides)**
- Long chains
- Examples: Starch, Glycogen, Cellulose

### The Big Tests

**Iodine Test for STARCH:**
- Add iodine solution
- Turns BLUE-BLACK if starch present! 🔵

**Benedict's Test for GLUCOSE:**
- Add Benedict's, heat gently
- Turns orange RED if glucose present! 🔴

### Energy Release
Glucose + Oxygen → CO₂ + Water + ENERGY`,
    key_terms: ['Glucose', 'Starch', 'Iodine Test', 'Benedict Test']
  },
  {
    id: 104,
    subject_code: '0610',
    topic: 'Biological Molecules',
    subtopic: 'Enzymes',
    content: `## 🧬 Enzymes

Enzymes are BIOLOGICAL CATALYSTS - they speed up reactions!

### Lock and Key

The enzyme fits the substrate like a puzzle piece!
Once reaction is done, product releases and enzyme is ready again!

### Factors Affecting Enzymes

**1. Temperature:**
- Best at 37°C (body temp!)
- Too hot = denatured (ruined forever!) 🔥

**2. pH:**
- Different enzymes work at different pH
- Pepsin works in stomach (acidic)

**3. Substrate concentration:**
- More substrate = faster reaction (up to a point!)

### Remember
> **"Temperature and pH can DENATURE!"**`,
    key_terms: ['Enzyme', 'Substrate', 'Active Site', 'Denature']
  },
  {
    id: 105,
    subject_code: '0610',
    topic: 'Classification',
    subtopic: 'Five Kingdoms',
    content: `## 🦋 The Five Kingdoms

All living things fit into 5 groups!

### 1. Prokaryotes
- NO nucleus!
- Single-celled
- Examples: Bacteria

### 2. Protoctists
- Single-celled WITH nucleus
- Examples: Amoeba, Plasmodium

### 3. Fungi
- Don't make own food
- Examples: Mushrooms, Yeast

### 4. Plants
- Make own food (photosynthesis!)
- Examples: Flowers, Trees

### 5. Animals
- Move to get food!
- Examples: Humans, Fish

### Binomial Naming
Scientists use TWO names:
- Genus (capitalized)
- Species (lowercase)
- Example: Homo sapiens!`,
    key_terms: ['Kingdom', 'Species', 'Classification']
  },
  // CHEMISTRY (0620)
  {
    id: 201,
    subject_code: '0620',
    topic: 'States of Matter',
    subtopic: 'Kinetic Theory',
    content: `## 🌊 Kinetic Particle Theory

Everything is made of tiny particles!

### The Three States

**SOLID** ❄️
- Particles vibrate in place
- Fixed shape & volume
- Close together, strong forces

**LIQUID** 💧
- Particles slide past each other
- Fixed volume, no fixed shape

**GAS** 💨
- Particles move freely
- No fixed shape or volume

### Changing States

Solid → Liquid = **Melting** 🔥
Liquid → Gas = **Boiling** 💨
Gas → Liquid = **Condensation** 💧
Liquid → Solid = **Freezing** ❄️

### Key Points
- Mass STAYS THE SAME!
- Only arrangement changes`,
    key_terms: ['Particle', 'Kinetic Theory', 'Melting']
  },
  {
    id: 202,
    subject_code: '0620',
    topic: 'Atomic Structure',
    subtopic: 'Inside the Atom',
    content: `## ⚛️ Inside the Atom

Atoms are the building blocks!

### The Parts

**PROTONS** (+ charge)
- In the nucleus
- Same as atomic number!

**NEUTRONS** (no charge)
- In the nucleus
- Adds to mass number

**ELECTRONS** (- charge)
- Orbit around the nucleus
- Same number as protons!

### Atomic Data
- **Atomic Number (Z)** = Number of protons
- **Mass Number (A)** = Protons + Neutrons

### Example - Carbon
- Atomic number: 6 (6 protons, 6 electrons)
- Mass number: 12 (6 protons + 6 neutrons)

### Isotopes
Same protons, different neutrons!`,
    key_terms: ['Proton', 'Neutron', 'Electron', 'Nucleus', 'Isotope']
  },
  {
    id: 203,
    subject_code: '0620',
    topic: 'Periodic Table',
    subtopic: 'Groups & Periods',
    content: `## 📊 The Periodic Table

Mendeleev was a genius! Elements arranged by properties!

### Structure

**PERIODS** = Horizontal rows (same electron shells)
**GROUPS** = Vertical columns (same valence electrons!)

### Key Groups

**Group 1: Alkali Metals**
- Very reactive!
- Soft, silvery
- React with water

**Group 7: Halogens**
- Reactive non-metals
- Coloured vapours

**Group 0: Noble Gases**
- Unreactive! (full shells)
- Colourless gases

### Reactivity Trend
- Group 1: More reactive DOWN
- Group 7: Less reactive DOWN`,
    key_terms: ['Period', 'Group', 'Valence Electrons']
  },
  {
    id: 204,
    subject_code: '0620',
    topic: 'Chemical Bonding',
    subtopic: 'Ionic Bonds',
    content: `## 🔗 Ionic Bonding

Ionic bonds form when METALS give electrons to NON-METALS!

### The Process

**1. Metal loses electrons → positive ion**
Na → Na⁺ + e⁻

**2. Non-metal gains electrons → negative ion**
Cl + e⁻ → Cl⁻

**3. Opposite charges attract!**
Na⁺ + Cl⁻ → NaCl (Sodium Chloride!)

### Properties of Ionic Compounds
- High melting/boiling points
- Conduct electricity when melted/dissolved
- Brittle (crack when hit!)`,
    key_terms: ['Ion', 'Cation', 'Anion', 'Electrolyte']
  },
  {
    id: 205,
    subject_code: '0620',
    topic: 'Chemical Bonding',
    subtopic: 'Covalent Bonds',
    content: `## 🤝 Covalent Bonding

Non-metals share electrons!

### Simple Molecules

**Hydrogen (H₂):**
H : H - Shares 1 electron each

**Water (H₂O):**
O shares with 2 hydrogens!

**Carbon Dioxide (CO₂):**
O = C = O (double bonds!)

### Properties
- Low melting/boiling points
- Don't conduct electricity
- Often gases or liquids

### Giant Structures
Diamond: Every C bonded to 4 C's - super hard!
Graphite: Layers that slide!`,
    key_terms: ['Molecule', 'Covalent', 'Bond']
  },
  // PHYSICS (0625)
  {
    id: 301,
    subject_code: '0625',
    topic: 'Mechanics',
    subtopic: 'Mass, Weight & Density',
    content: `## ⚖️ Mass, Weight & Density

Three related but NOT the same!

### Mass
- Amount of matter
- Measured in **kilograms (kg)**
- NEVER changes!
- Measured with a BALANCE

### Weight
- Force of gravity on mass
- **W = m × g**
- g ≈ 10 N/kg on Earth

### Density
- How tightly packed!
- **ρ = m/V**
- Units: kg/m³

### Remember
> **"Dense objects sink, less dense objects float!"**

### Water Density
= 1000 kg/m³ (or 1 g/cm³)`,
    key_terms: ['Mass', 'Weight', 'Density', 'Gravity']
  },
  {
    id: 302,
    subject_code: '0625',
    topic: 'Mechanics',
    subtopic: 'Kinematics',
    content: `## 🏃 Kinematics

Let's describe motion precisely!

### Key Quantities

**Speed:** How fast (distance per time)
v = d/t → m/s

**Velocity:** Speed with DIRECTION!

**Acceleration:** Change in velocity per time
a = (v - u)/t → m/s²

### The Equations

v = u + at
s = ut + ½at²
v² = u² + 2as

u = initial velocity
v = final velocity
a = acceleration
s = displacement
t = time

### Example
Car accelerates from 0 to 20 m/s in 10s
a = (20 - 0)/10 = **2 m/s²** ✓`,
    key_terms: ['Speed', 'Velocity', 'Acceleration']
  },
  {
    id: 303,
    subject_code: '0625',
    topic: 'Mechanics',
    subtopic: 'Forces & Motion',
    content: `## 💪 Newton's Laws

Sir Isaac Newton's three genius laws:

### First Law
"Objects keep doing what they're doing unless acted upon!"
- Seatbelts prevent you flying forward!
- Inertia = resistance to change

### Second Law
**F = ma**
Force = Mass × Acceleration
Example: 2kg × 5 m/s² = **10 N**

### Third Law
"For every action, there's an equal and opposite reaction!"
- When you push a wall, it pushes back!

### Momentum
p = mv (kg m/s)
Total momentum before = Total momentum after!`,
    key_terms: ['Newton', 'Force', 'Inertia', 'Momentum']
  },
  {
    id: 304,
    subject_code: '0625',
    topic: 'Energy',
    subtopic: 'Forms & Transfer',
    content: `## ⚡ Energy

Energy cannot be created or destroyed - only transferred!

### Forms

**Kinetic (KE)** - Movement energy
**Potential (PE)** - Stored energy
**Thermal/Heat** - Internal energy
**Electrical** - Moving electrons
**Light** - From the sun!
**Sound** - Vibrations
**Nuclear** - Inside atoms!

### Energy Transfer

**Work Done = Force × Distance**
W = Fd (Joules!)

**Power = Work Done / Time**
P = W/t (Watts!)

### Efficiency
Useful Energy Out ÷ Total Energy In × 100%
- Always less than 100% due to waste!`,
    key_terms: ['Kinetic', 'Potential', 'Work', 'Power']
  },
  {
    id: 305,
    subject_code: '0625',
    topic: 'Thermal Physics',
    subtopic: 'Heat Transfer',
    content: `## 🌡️ Heat Transfer

Heat always flows from HOT to COLD!

### Three Methods

**1. Conduction**
- Through solids
- Heat vibrates particles
- Metals conduct well!

**2. Convection**
- In liquids and gases
- Hot rises, cold sinks
- Creates currents!

**3. Radiation**
- Electromagnetic waves
- Doesn't need a medium!
- Dark surfaces absorb better

### Specific Heat Capacity
**E = mcΔT**
- c = specific heat capacity
- ΔT = temperature change

### Water is Special
- High SHC (4200 J/kg°C)
- Why coastal areas stay mild!`,
    key_terms: ['Conduction', 'Convection', 'Radiation']
  },
  // ACCOUNTING (0452)
  {
    id: 401,
    subject_code: '0452',
    topic: 'Introduction to Accounting',
    subtopic: 'What is Accounting?',
    content: `## 📊 Accounting

Accounting is MORE than math - it's telling the business story!

### What is Accounting?
- Recording financial information
- Classifying transactions
- Summarising results

### Who Uses It?

**Internal:** Owners, Managers, Employees
**External:** Banks, Suppliers, Government

### The Accounting Equation

**ASSETS = LIABILITIES + CAPITAL**

**Asset:** Something owned (cash, buildings)
**Liability:** Something owed (loans)
**Capital:** Owner's investment

### Example
Business has:
- Cash: $10,000 (Asset)
- Equipment: $5,000 (Asset)
- Bank Loan: $8,000 (Liability)

Capital = $10,000 + $5,000 - $8,000 = **$7,000** ✓`,
    key_terms: ['Assets', 'Liabilities', 'Capital']
  },
  {
    id: 402,
    subject_code: '0452',
    topic: 'The Accounting Cycle',
    subtopic: 'Source Documents',
    content: `## 📋 The Accounting Cycle

Every transaction follows this journey:

### 1. Source Documents
First proof! (Invoices, cheque counterfoils)

### 2. Books of Original Entry
Where we FIRST record!
- Sales Day Book
- Purchases Day Book
- Cash Book

### 3. General Ledger
Organised by account!

### 4. Trial Balance
Testing arithmetic!

### The Golden Rule
> **"For every debit, there is a credit!"**

This is DOUBLE ENTRY bookkeeping!`,
    key_terms: ['Source Document', 'Ledger', 'Double Entry']
  },
  {
    id: 403,
    subject_code: '0452',
    topic: 'Double Entry',
    subtopic: 'Debit & Credit Rules',
    content: `## ⚖️ Debit and Credit

What's debited must be credited!

### The Rules

**DEBIT (Left side):**
- Increases assets
- Increases expenses

**CREDIT (Right side):**
- Increases liabilities
- Increases income

### Memory Trick
> **"DEAD"**
> - Debits: Expenses, Assets, Drawings

### Example

**Sold goods for cash $500:**
- Cash (Asset) ↑ → Debit $500
- Sales (Income) ↑ → Credit $500`,
    key_terms: ['Debit', 'Credit', 'T-Account']
  },
  {
    id: 404,
    subject_code: '0452',
    topic: 'Financial Statements',
    subtopic: 'Balance Sheet',
    content: `## 📊 The Balance Sheet

Also called Statement of Financial Position!

### What's Included

**Non-Current Assets:**
- Buildings, Equipment (> 1 year)

**Current Assets:**
- Cash, Debtors, Stock (< 1 year)

**Current Liabilities:**
- Creditors, Overdraft (< 1 year)

**Non-Current Liabilities:**
- Long-term loans (> 1 year)

**Capital:**
- Owner's investment + Profits - Drawings

### Key Concepts
- Going concern
- Business entity
- Historical cost`,
    key_terms: ['Balance Sheet', 'Current Assets']
  },
  // BUSINESS STUDIES (0450)
  {
    id: 501,
    subject_code: '0450',
    topic: 'Business Activity',
    subtopic: 'Added Value',
    content: `## 💎 Adding Value

Adding value means making a product more desirable!

### How to Add Value
1. **Branding** - Make it recognizable!
2. **Quality** - Better materials!
3. **Design** - User-friendly!
4. **Convenience** - Fast delivery!
5. **Location** - Easy to reach!

### Formula
**Added Value = Selling Price - Cost of Inputs**

### Example
- Raw materials: $50
- Selling price: $150
- Added Value = $150 - $50 = **$100** ✓

### Why It Matters
- Higher profits!
- Competitive advantage!`,
    key_terms: ['Added Value', 'Branding', 'Competitive Advantage']
  },
  {
    id: 502,
    subject_code: '0450',
    topic: 'People in Business',
    subtopic: 'Motivation',
    content: `## 🎯 Motivating Employees

Motivated employees = productive employees!

### Maslow's Hierarchy

1. **Physiological** - Food, water!
2. **Safety** - Security!
3. **Social** - Friendship!
4. **Esteem** - Status!
5. **Self-actualisation** - Potential!

### Herzberg's Two Factors

**Motivators:**
- Achievement, Recognition, Responsibility

**Hygiene Factors:**
- Salary, Work conditions

### Leadership Styles
- **Autocratic:** I decide!
- **Democratic:** Let's decide together!
- **Laissez-faire:** You decide!`,
    key_terms: ['Motivation', 'Maslow', 'Herzberg']
  },
  {
    id: 503,
    subject_code: '0450',
    topic: 'Marketing',
    subtopic: 'The 4 Ps',
    content: `## 🎯 Marketing Mix

Every business uses these 4 tools!

### 1. PRODUCT
- What you're selling!
- Quality, design, packaging

### 2. PRICE
- How much customers pay!
- Competition-based pricing

### 3. PLACE
- Where it's sold!
- Distribution channels

### 4. PROMOTION
- Telling people!
- Advertising, Social media

### Market Research

**Primary:** Surveys, interviews (expensive!)
**Secondary:** Internet, reports (cheaper!)`,
    key_terms: ['Marketing Mix', '4 Ps', 'Target Market']
  },
  {
    id: 504,
    subject_code: '0450',
    topic: 'Operations Management',
    subtopic: 'Production',
    content: `## 🏭 Production Methods

### Types

**Job Production:**
- One at a time
- Custom made!
- Expensive!

**Batch Production:**
- Groups at a time
- Examples: Bread
- Moderate cost!

**Flow Production:**
- Continuous!
- Examples: Cars
- Low cost, low skill!

### Costs

- Fixed Costs (FC): Rent, salaries
- Variable Costs (VC): Materials
- Total: TC = FC + VC

### Break-Even
**BEP = Fixed Costs / Contribution**`,
    key_terms: ['Job Production', 'Batch Production', 'Break-Even']
  },
  // ECONOMICS (0455)
  {
    id: 601,
    subject_code: '0455',
    topic: 'Introduction',
    subtopic: 'Economic Problem',
    content: `## 🎯 The Economic Problem

The world has LIMITED resources but UNLIMITED wants!

### The Basic Problem
**WANTS ≠ RESOURCES**

### Factors of Production (CELL)

**C**apital - Money, machines
**E**nterprise - The risk-taker!
**L**and - Natural resources
**L**abour - Human effort

### Opportunity Cost
The cost of the NEXT BEST alternative!

### The PPC Curve
Shows scarcity, choice, and opportunity cost!`,
    key_terms: ['Scarcity', 'Opportunity Cost', 'PPC']
  },
  {
    id: 602,
    subject_code: '0455',
    topic: 'Demand & Supply',
    subtopic: 'Market Equilibrium',
    content: `## ⚖️ Demand & Supply

### Demand
**Law: Price ↑ = Quantity Demanded ↓**

### Supply  
**Law: Price ↑ = Quantity Supplied ↑**

### Market Equilibrium
Where supply = demand!

### Changes
- Increase demand → Price rises!
- Increase supply → Price falls!

### Determinants
- Income
- Tastes
- Prices of substitutes
- Population!`,
    key_terms: ['Demand', 'Supply', 'Equilibrium']
  },
  // GEOGRAPHY (0460)
  {
    id: 701,
    subject_code: '0460',
    topic: 'Population',
    subtopic: 'Demographic Transition',
    content: `## 👥 Population Dynamics

### Key Measures

**Birth Rate:** Babies born per 1000/year
**Death Rate:** Deaths per 1000/year
**Natural Increase:** Birth rate - Death rate

### DTM Stages

1. High birth + High death = Stable
2. High birth + Falling death = Rapid growth
3. Falling birth + Low death = Slow growth
4. Low birth + Low death = Stable
5. Very low birth < death = Decline!

### Why Countries Develop
- Better medicine!
- Education!
- More women work!`,
    key_terms: ['Birth Rate', 'DTM', 'Migration']
  },
  {
    id: 702,
    subject_code: '0460',
    topic: 'Natural Hazards',
    subtopic: 'Plate Tectonics',
    content: `## 🌋 Plate Tectonics

### Three Boundaries

**1. Constructive (Divergent)**
- Plates move APART!
- Creates NEW crust!
- Volcanoes, ridges!

**2. Destructive (Convergent)**
- Plates move TOGETHER!
- Trenches, volcanoes!

**3. Conservative (Transform)**
- Plates slide PAST!
- Powerful earthquakes!

### Measurement

**Richter Scale:**
- Logarithmic!
- 7 = Major!

**Mercalli Scale:**
- Based on DAMAGE!`,
    key_terms: ['Plate', 'Earthquake', 'Volcano']
  },
  {
    id: 703,
    subject_code: '0460',
    topic: 'Weather & Climate',
    subtopic: 'Tropical Rainforests',
    content: `## 🌴 Tropical Rainforests

### Location
Near equator! (Amazon, Congo, SE Asia)

### Climate
- Hot: 27°C+
- Wet: 2000mm+ rain/year

### Adaptations
- Drip tips (runoff water!)
- Buttress roots (support!)
- Tall trees (competition for light!)

### Importance
- Oxygen production!
- Biodiversity!
- Carbon sinks!

### Threats
- Deforestation!
- Logging, farming!`,
    key_terms: ['Rainforest', 'Biodiversity', 'Deforestation']
  },
  // ENGLISH (0500)
  {
    id: 801,
    subject_code: '0500',
    topic: 'Language Basics',
    subtopic: 'Parts of Speech',
    content: `## 🔤 Parts of Speech

### 1. NOUN - Person, Place, Thing!
- Commons: dog, city
- Proper: London

### 2. VERB - Action or State!
- Run, eat, be

### 3. ADJECTIVE - Describes Noun!
- Beautiful day, happy child

### 4. ADVERB - Describes Verb!
- Quickly ran, very happy

### 5. PRONOUN - Replaces Noun!
- He, she, it, they

### 6. CONJUNCTION - Joins Words!
- FANBOYS: For, And, Nor, But, Or, Yet, So

### 7. PREPOSITION - Shows Relationship!
- In, on, under, between`,
    key_terms: ['Noun', 'Verb', 'Adjective', 'Adverb']
  },
  {
    id: 802,
    subject_code: '0500',
    topic: 'Writing Skills',
    subtopic: 'Descriptive Writing',
    content: `## ✍️ Descriptive Writing

Paint with words! Make the reader SEE, HEAR, FEEL!

### Techniques

**Simile:** Like or as
- "Her smile was like sunshine"

**Metaphor:** Direct comparison
- "Life is a journey"

**Personification:** Human on objects
- "The wind whispered"

**Onomatopoeia:** Sound words!
- "Splash!", "buzz!"

**Sensory Details**
- See: bright, dark
- Hear: roar, whisper

### The Golden Rule
> **"SHOW, don't TELL!"**

Don't say: "She was scared."
Say: "Her heart hammered..."`,
    key_terms: ['Simile', 'Metaphor', 'Personification']
  },
  {
    id: 803,
    subject_code: '0500',
    topic: 'Reading Comprehension',
    subtopic: 'Reading Strategies',
    content: `## 📖 Reading for Understanding

### Step-by-Step

**1. Skim First**
- Read headlines
- Look at pictures

**2. Read Carefully**
- Underline key points

**3. Answer Questions**
- Look for evidence!

### Question Types

**Literal:** Straight from text!
**Inference:** Between the lines!
**Evaluation:** Give your opinion!

### Finding Answers
> Look for KEY WORDS in the question!
> Find them in the text!

### Time Management
- 1 minute per mark!`,
    key_terms: ['Inference', 'Evidence', 'Main Idea']
  }
];

export default studyContentData;