import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rkpboggxuqhnjbzztmoq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nqJWyk2AE6Wt--1b19828g_ObG52Ytn'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 3-5 questions per concept (existing ones will be skipped)
const EXTRA_QUESTIONS = [
  // ---------- Algebra: Solving Linear Equations ----------
  { subject: "Algebra", name: "Solving Linear Equations", question: "Solve for x: 5x + 10 = 35", answer: "5", hint: "Subtract 10, then divide by 5." },
  { subject: "Algebra", name: "Solving Linear Equations", question: "Solve for x: x/3 + 2 = 7", answer: "15", hint: "Subtract 2 then multiply both sides by 3." },
  { subject: "Algebra", name: "Solving Linear Equations", question: "Solve for x: 2(x - 4) = 12", answer: "10", hint: "Expand: 2x - 8 = 12, then solve." },

  // ---------- Algebra: Quadratic Equations ----------
  { subject: "Algebra", name: "Quadratic Equations", question: "Solve x^2 + 5x + 6 = 0 (give both roots separated by comma)", answer: "-2, -3", hint: "Find two numbers that multiply to 6 and add to 5, then factor." },
  { subject: "Algebra", name: "Quadratic Equations", question: "What is the discriminant of x^2 - 4x + 4 = 0?", answer: "0", hint: "Use the formula b² − 4ac. Identify a, b, c from the equation." },
  { subject: "Algebra", name: "Quadratic Equations", question: "Solve x^2 - 7x + 12 = 0 (give both roots separated by comma)", answer: "3, 4", hint: "Find two numbers that multiply to 12 and add to 7, then factor." },

  // ---------- Calculus: Differentiation ----------
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of sin(x)?", answer: "cos(x)", hint: "Think about which trig function is the derivative of sin." },
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of e^x?", answer: "e^x", hint: "This special function has a unique property when differentiated." },
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of ln(x)?", answer: "1/x", hint: "Think about which function, when integrated, gives ln(x)." },
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of x^4?", answer: "4x^3", hint: "Power rule: bring down exponent, reduce by 1." },

  // ---------- Calculus: Integration ----------
  { subject: "Calculus", name: "Integration", question: "What is the integral of cos(x) dx?", answer: "sin(x) + C", hint: "Which trig function has cos(x) as its derivative? Don't forget + C." },
  { subject: "Calculus", name: "Integration", question: "What is the integral of e^x dx?", answer: "e^x + C", hint: "This special function integrates to itself. Don't forget + C." },
  { subject: "Calculus", name: "Integration", question: "What is the integral of 3 dx?", answer: "3x + C", hint: "Integral of a constant k is kx + C." },
  { subject: "Calculus", name: "Integration", question: "What is the integral of x^3 dx?", answer: "x^4/4 + C", hint: "Reverse power rule: raise exponent by 1, divide by new exponent." },

  // ---------- Geometry: Pythagoras Theorem ----------
  { subject: "Geometry", name: "Pythagoras Theorem", question: "In a right triangle with legs 5 and 12, what is the hypotenuse?", answer: "13", hint: "Use c = √(a² + b²). Square both legs and add them." },
  { subject: "Geometry", name: "Pythagoras Theorem", question: "In a right triangle with hypotenuse 10 and one leg 6, find the other leg", answer: "8", hint: "Rearrange Pythagoras: b = √(c² − a²)." },
  { subject: "Geometry", name: "Pythagoras Theorem", question: "In a right triangle with legs 8 and 15, what is the hypotenuse?", answer: "17", hint: "Use c = √(a² + b²). Square both legs and add them." },

  // ---------- Geometry: Area of Circles ----------
  { subject: "Geometry", name: "Area of Circles", question: "Calculate the area of a circle with radius 7 (in terms of pi)", answer: "49pi", hint: "Use A = πr². Substitute r = 7 and simplify." },
  { subject: "Geometry", name: "Area of Circles", question: "A circle has diameter 10. What is its area (in terms of pi)?", answer: "25pi", hint: "First find the radius from the diameter, then use A = πr²." },
  { subject: "Geometry", name: "Area of Circles", question: "A circle has area 16pi. What is its diameter?", answer: "8", hint: "From A = πr², find r² first, then r, then diameter = 2r." },

  // ---------- Geometry: Area of Triangles ----------
  { subject: "Geometry", name: "Area of Triangles", question: "Calculate the area of a triangle with base 6 and height 9", answer: "27", hint: "Use A = ½ × base × height. Plug in the values." },
  { subject: "Geometry", name: "Area of Triangles", question: "A triangle has area 30 and height 6. What is the base?", answer: "10", hint: "Rearrange A = ½ × b × h to solve for b." },
  { subject: "Geometry", name: "Area of Triangles", question: "Calculate the area of an equilateral triangle with side 4 (in terms of sqrt)", answer: "4sqrt(3)", hint: "Use the equilateral triangle formula: A = (√3/4) × s². Substitute s = 4." },

  // ---------- Trigonometry: SOH CAH TOA ----------
  { subject: "Trigonometry", name: "SOH CAH TOA", question: "In a right triangle, opp = 3, hyp = 5. What is sin(angle)?", answer: "3/5", hint: "SOH: sin = opposite/hypotenuse." },
  { subject: "Trigonometry", name: "SOH CAH TOA", question: "In a right triangle, adj = 4, hyp = 5. What is cos(angle)?", answer: "4/5", hint: "CAH: cos = adjacent/hypotenuse." },
  { subject: "Trigonometry", name: "SOH CAH TOA", question: "In a right triangle, opp = 3, adj = 4. What is tan(angle)?", answer: "3/4", hint: "TOA: tan = opposite/adjacent." },

  // ---------- Trigonometry: Common Angles ----------
  { subject: "Trigonometry", name: "Common Angles", question: "What is sin(30) degrees?", answer: "1/2", hint: "30° is a standard angle. Think of the 30-60-90 triangle ratios." },
  { subject: "Trigonometry", name: "Common Angles", question: "What is cos(60) degrees?", answer: "1/2", hint: "60° is a standard angle. Think of the 30-60-90 triangle ratios." },
  { subject: "Trigonometry", name: "Common Angles", question: "What is sin(0) degrees?", answer: "0", hint: "At 0° on the unit circle, what is the y-coordinate?" },
  { subject: "Trigonometry", name: "Common Angles", question: "What is cos(90) degrees?", answer: "0", hint: "At 90° on the unit circle, what is the x-coordinate?" },

  // ---------- Probability: Simple Probability ----------
  { subject: "Probability", name: "Simple Probability", question: "Probability of rolling an even number on a 6-sided die (fraction)", answer: "1/2", hint: "Even numbers: 2,4,6 → 3 out of 6." },
  { subject: "Probability", name: "Simple Probability", question: "Probability of picking a vowel from the word MATH (fraction)", answer: "1/4", hint: "Vowels in MATH: only A. 1 out of 4 letters." },
  { subject: "Probability", name: "Simple Probability", question: "Probability of drawing a red card from a standard deck (fraction)", answer: "1/2", hint: "26 red cards out of 52." },

  // ---------- Probability: Independent Events ----------
  { subject: "Probability", name: "Independent Events", question: "Probability of rolling a 1 then a 2 on a fair die (fraction)", answer: "1/36", hint: "P(1) × P(2) = 1/6 × 1/6." },
  { subject: "Probability", name: "Independent Events", question: "A fair coin is flipped twice. Probability of tail then head (fraction)?", answer: "1/4", hint: "P(T) × P(H) = 1/2 × 1/2." },
  { subject: "Probability", name: "Independent Events", question: "Two dice are rolled. Probability both show 6 (fraction)?", answer: "1/36", hint: "For independent events, multiply the individual probabilities." },

  // ---------- Statistics: Mean ----------
  { subject: "Statistics", name: "Mean", question: "Calculate the mean of 3, 7, 11, 15", answer: "9", hint: "Add all values and divide by the count." },
  { subject: "Statistics", name: "Mean", question: "Calculate the mean of 100, 200, 300", answer: "200", hint: "Mean = sum of all values ÷ number of values." },
  { subject: "Statistics", name: "Mean", question: "Calculate the mean of 1, 2, 3, 4, 5, 6, 7, 8, 9", answer: "5", hint: "Add all 9 values, then divide the sum by 9." },

  // ---------- Statistics: Median ----------
  { subject: "Statistics", name: "Median", question: "Calculate the median of 3, 5, 7, 9, 11", answer: "7", hint: "Data is sorted. With odd count, pick the middle value." },
  { subject: "Statistics", name: "Median", question: "Calculate the median of 10, 20, 30, 40", answer: "25", hint: "Even count — average the two middle values." },
  { subject: "Statistics", name: "Median", question: "Calculate the median of 4, 1, 7, 2, 9", answer: "4", hint: "Sort the values first, then find the middle one." },

  // ---------- Statistics: Range ----------
  { subject: "Statistics", name: "Range", question: "Calculate the range of {3, 8, 1, 12, 5}", answer: "11", hint: "Range = maximum − minimum. Find the largest and smallest values." },
  { subject: "Statistics", name: "Range", question: "Calculate the range of {50, 50, 50}", answer: "0", hint: "When all values are the same, what is max − min?" },
  { subject: "Statistics", name: "Range", question: "Calculate the range of {-3, 0, 4, 7}", answer: "10", hint: "Range = max − min. Be careful with negative numbers." },

  // ---------- Arithmetic: Order of Operations ----------
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate 8 / 2 + 3", answer: "7", hint: "BODMAS/PEMDAS: do division before addition." },
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate 3 + 4^2", answer: "19", hint: "BODMAS/PEMDAS: evaluate the exponent before adding." },
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate (6 + 2) / (2 * 2)", answer: "2", hint: "Solve both brackets first, then divide." },
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate 2^3 - 4 / 2", answer: "6", hint: "BODMAS/PEMDAS: exponents first, then division, then subtraction." },
]

let inserted = 0
let skipped = 0

for (const q of EXTRA_QUESTIONS) {
  let { data: concept } = await supabase
    .from('concepts')
    .select('id')
    .eq('name', q.name)
    .eq('subject', q.subject)
    .single()

  if (!concept) {
    console.error(`  ✗ Concept not found: [${q.subject}] ${q.name}`)
    skipped++
    continue
  }

  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .eq('concept_id', concept.id)
    .eq('question_text', q.question)
    .single()

  if (existing) {
    // Update hint for existing question
    const { error: hintErr } = await supabase
      .from('questions')
      .update({ hint: q.hint })
      .eq('id', existing.id)
    if (hintErr) {
      console.error(`  ✗ Hint update failed: "${q.question.slice(0, 40)}":`, hintErr.message)
    } else {
      console.log(`  ↻ Updated hint: "${q.question.slice(0, 55)}…"`)
    }
    skipped++
    continue
  }

  const { error } = await supabase
    .from('questions')
    .insert({
      concept_id: concept.id,
      question_text: q.question,
      correct_answer: q.answer,
      hint: q.hint,
    })

  if (error) {
    console.error(`  ✗ Error inserting "${q.question.slice(0, 40)}":`, error.message)
    skipped++
  } else {
    console.log(`  ✓ Inserted: "${q.question.slice(0, 55)}"`)
    inserted++
  }
}

console.log(`\nDone. ${inserted} questions inserted, ${skipped} skipped.`)
