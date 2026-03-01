import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rkpboggxuqhnjbzztmoq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nqJWyk2AE6Wt--1b19828g_ObG52Ytn'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Map question_text → hint
const HINTS = {
  "Solve for x: 2x + 5 = 15":
    "Subtract 5 from both sides first, then divide by 2.",
  "Solve for x: 3x - 7 = 8":
    "Add 7 to both sides first, then divide by 3.",
  "Find the positive solution for x: x^2 - 16 = 0":
    "This is a difference of two squares: x² = 16. Take the positive square root.",
  "Expand (x + 3)(x - 3)":
    "Use the difference of squares formula: (a+b)(a−b) = a² − b².",
  "What is the derivative of x^2?":
    "Apply the power rule: d/dx(xⁿ) = nxⁿ⁻¹.",
  "What is the derivative of 5x?":
    "The derivative of a constant times x is just the constant.",
  "What is the integral of 2x dx?":
    "Reverse the power rule: ∫xⁿ dx = xⁿ⁺¹/(n+1). Don't forget + C.",
  "In a right triangle with legs 3 and 4, what is the length of the hypotenuse?":
    "Use Pythagoras: c = √(a² + b²) = √(9 + 16).",
  "Calculate the area of a circle with radius 2 (in terms of pi)":
    "Use A = πr². Substitute r = 2 and write the answer as a number times pi.",
  "Calculate the area of a triangle with base 10 and height 5":
    "Use A = ½ × base × height.",
  "Which trig function is Opposite / Hypotenuse?":
    "Remember SOH: Sin = Opposite / Hypotenuse.",
  "What is sin(90) degrees?":
    "Think of the unit circle at 90°. The y-coordinate is your answer.",
  "What is cos(0) degrees?":
    "At 0° on the unit circle, what is the x-coordinate?",
  "What is tan(45) degrees?":
    "tan = sin/cos. At 45° both sin and cos are equal, so their ratio is…",
  "Probability of rolling a 6 on a 6-sided die (fraction)":
    "There is 1 favourable outcome and 6 total outcomes. Write as a fraction.",
  "Probability of flipping two heads in a row (fraction)":
    "For independent events, multiply the individual probabilities: ½ × ½.",
  "Calculate the mean of 2, 4, 6, 8, 10":
    "Add all values and divide by 5 (the count).",
  "Calculate the median of 1, 3, 3, 6, 7, 8, 9":
    "The data is already sorted. Pick the middle (4th) value.",
  "Calculate the range of {5, 12, 3, 20}":
    "Range = maximum − minimum. Find the largest and smallest values.",
  "Calculate 2 + 3 * 4":
    "Remember BODMAS/PEMDAS: multiplication before addition.",
}

let updated = 0
let failed = 0

for (const [questionText, hint] of Object.entries(HINTS)) {
  const { error } = await supabase
    .from('questions')
    .update({ hint })
    .eq('question_text', questionText)

  if (error) {
    console.error(`  ✗ "${questionText}":`, error.message)
    failed++
  } else {
    console.log(`  ✓ "${questionText.slice(0, 50)}…"`)
    updated++
  }
}

console.log(`\nDone. ${updated} hints set, ${failed} failed.`)
