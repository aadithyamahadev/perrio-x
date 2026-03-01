import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rkpboggxuqhnjbzztmoq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nqJWyk2AE6Wt--1b19828g_ObG52Ytn'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 2 extra questions per concept for overlearning reinforcement
const EXTRA_QUESTIONS = [
  // Solving Linear Equations (already has 2 — add 1 more so total = 3)
  { subject: "Algebra", name: "Solving Linear Equations", question: "Solve for x: 4x - 3 = 13", answer: "4", hint: "Add 3 to both sides, then divide by 4." },

  // Quadratic Equations (already has 2 — add 1 more)
  { subject: "Algebra", name: "Quadratic Equations", question: "What are the solutions of x^2 - 9 = 0?", answer: "3 and -3", hint: "Factor as (x+3)(x−3) = 0 and solve each factor." },

  // Differentiation (already has 2 — add 1 more)
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of 3x^3?", answer: "9x^2", hint: "Power rule: bring down the exponent, reduce by 1. 3·3 = 9, x^(3-1) = x^2." },

  // Integration (has 1 — add 2)
  { subject: "Calculus", name: "Integration", question: "What is the integral of 6x^2 dx?", answer: "2x^3 + C", hint: "Reverse power rule: raise exponent by 1 and divide. 6/(2+1) = 2." },
  { subject: "Calculus", name: "Integration", question: "What is the integral of 1 dx?", answer: "x + C", hint: "The integral of a constant k is kx + C." },

  // Pythagoras Theorem (has 1 — add 2)
  { subject: "Geometry", name: "Pythagoras Theorem", question: "A right triangle has hypotenuse 13 and one leg 5. What is the other leg?", answer: "12", hint: "Use a² + b² = c². So b = √(13² − 5²) = √(169 − 25)." },
  { subject: "Geometry", name: "Pythagoras Theorem", question: "A right triangle has legs 6 and 8. What is the hypotenuse?", answer: "10", hint: "c = √(6² + 8²) = √(36 + 64) = √100." },

  // Area of Circles (has 1 — add 2)
  { subject: "Geometry", name: "Area of Circles", question: "What is the area of a circle with radius 5 (in terms of pi)?", answer: "25pi", hint: "A = πr². Substitute r = 5: π × 25." },
  { subject: "Geometry", name: "Area of Circles", question: "A circle has area 9pi. What is its radius?", answer: "3", hint: "A = πr², so r² = 9 and r = √9." },

  // Area of Triangles (has 1 — add 2)
  { subject: "Geometry", name: "Area of Triangles", question: "Calculate the area of a triangle with base 8 and height 3", answer: "12", hint: "A = ½ × 8 × 3 = 12." },
  { subject: "Geometry", name: "Area of Triangles", question: "A triangle has area 20 and base 10. What is its height?", answer: "4", hint: "20 = ½ × 10 × h → h = 40/10." },

  // SOH CAH TOA (has 1 — add 2)
  { subject: "Trigonometry", name: "SOH CAH TOA", question: "Which trig function is Adjacent / Hypotenuse?", answer: "cos", hint: "CAH: Cos = Adjacent / Hypotenuse." },
  { subject: "Trigonometry", name: "SOH CAH TOA", question: "Which trig function is Opposite / Adjacent?", answer: "tan", hint: "TOA: Tan = Opposite / Adjacent." },

  // Common Angles (already has 3 — no extras needed, but add 0)

  // Simple Probability (has 1 — add 2)
  { subject: "Probability", name: "Simple Probability", question: "Probability of drawing a heart from a standard deck (fraction)", answer: "1/4", hint: "There are 13 hearts out of 52 cards. Simplify 13/52." },
  { subject: "Probability", name: "Simple Probability", question: "A bag has 3 red and 7 blue balls. Probability of picking red (fraction)?", answer: "3/10", hint: "Favourable = 3 red, total = 10 balls." },

  // Independent Events (has 1 — add 2)
  { subject: "Probability", name: "Independent Events", question: "Probability of rolling two 6s in a row with a fair die (fraction)", answer: "1/36", hint: "P(6) × P(6) = 1/6 × 1/6." },
  { subject: "Probability", name: "Independent Events", question: "A coin is flipped 3 times. Probability of all heads (fraction)?", answer: "1/8", hint: "½ × ½ × ½ = 1/8." },

  // Mean (has 1 — add 2)
  { subject: "Statistics", name: "Mean", question: "Calculate the mean of 10, 20, 30", answer: "20", hint: "Sum = 60, count = 3, mean = 60/3." },
  { subject: "Statistics", name: "Mean", question: "Calculate the mean of 5, 5, 5, 5", answer: "5", hint: "All values are equal, so the mean equals that value." },

  // Median (has 1 — add 2)
  { subject: "Statistics", name: "Median", question: "Calculate the median of 2, 8, 4, 6", answer: "5", hint: "Sort: 2, 4, 6, 8. Even count → average the two middle: (4+6)/2." },
  { subject: "Statistics", name: "Median", question: "Calculate the median of 1, 2, 3, 4, 5", answer: "3", hint: "Odd count, sorted. The middle (3rd) value is 3." },

  // Range (has 1 — add 2)
  { subject: "Statistics", name: "Range", question: "Calculate the range of {10, 25, 15, 30}", answer: "20", hint: "Max = 30, Min = 10. Range = 30 − 10." },
  { subject: "Statistics", name: "Range", question: "Calculate the range of {7, 7, 7}", answer: "0", hint: "All values are the same, so max − min = 0." },

  // Order of Operations (has 1 — add 2)
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate (2 + 3) * 4", answer: "20", hint: "Brackets first: 2 + 3 = 5, then 5 × 4." },
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate 10 - 2 * 3", answer: "4", hint: "Multiplication first: 2 × 3 = 6, then 10 − 6." },
]

let inserted = 0
let skipped = 0

for (const q of EXTRA_QUESTIONS) {
  // Find the concept by name + subject
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

  // Check if this exact question already exists
  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .eq('concept_id', concept.id)
    .eq('question_text', q.question)
    .single()

  if (existing) {
    console.log(`  ⊘ Already exists: "${q.question.slice(0, 50)}…"`)
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
    console.error(`  ✗ "${q.question.slice(0, 50)}…":`, error.message)
    skipped++
  } else {
    console.log(`  ✓ "${q.question.slice(0, 50)}…"`)
    inserted++
  }
}

console.log(`\nDone. ${inserted} questions inserted, ${skipped} skipped.`)
