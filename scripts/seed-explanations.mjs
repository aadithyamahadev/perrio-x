import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rkpboggxuqhnjbzztmoq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nqJWyk2AE6Wt--1b19828g_ObG52Ytn'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const EXPLANATIONS = {
  "Solving Linear Equations": "A linear equation has one variable. To solve, isolate the variable using inverse operations.\n\nExample: 4x + 2 = 10 → 4x = 8 → x = 2",
  "Quadratic Equations": "A quadratic equation has the form ax² + bx + c = 0. You can solve by factoring or using the quadratic formula.\n\nExample: x² - 9 = 0 → (x+3)(x-3) = 0 → x = 3 or x = -3",
  "Differentiation": "Differentiation finds the instantaneous rate of change. The power rule says d/dx(xⁿ) = nxⁿ⁻¹.\n\nExample: d/dx(x³) = 3x²",
  "Integration": "Integration is the reverse of differentiation. It finds the area under a curve. Add a constant C for indefinite integrals.\n\nExample: ∫3x² dx = x³ + C",
  "Pythagoras Theorem": "In a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c².\n\nExample: legs 5 and 12 → c = √(25+144) = √169 = 13",
  "Area of Circles": "The area of a circle is A = πr², where r is the radius (half the diameter).\n\nExample: radius = 3 → A = π(3²) = 9π",
  "Area of Triangles": "The area of a triangle is A = ½ × base × height. The height must be perpendicular to the base.\n\nExample: base = 8, height = 6 → A = ½ × 8 × 6 = 24",
  "SOH CAH TOA": "SOH: sin = Opposite/Hypotenuse. CAH: cos = Adjacent/Hypotenuse. TOA: tan = Opposite/Adjacent.\n\nExample: opposite = 3, hypotenuse = 5 → sin(θ) = 3/5 = 0.6",
  "Common Angles": "Memorise these values: sin(30°) = ½, sin(45°) = √2/2, sin(60°) = √3/2, sin(90°) = 1. cos is the reverse order.\n\nExample: cos(60°) = ½",
  "Simple Probability": "P(event) = number of favourable outcomes ÷ total outcomes. Result is always between 0 and 1.\n\nExample: P(even on a die) = 3/6 = 1/2",
  "Independent Events": "When events don't affect each other, multiply their probabilities: P(A and B) = P(A) × P(B).\n\nExample: P(two heads) = 1/2 × 1/2 = 1/4",
  "Mean": "The mean (average) = sum of all values ÷ number of values.\n\nExample: {3, 7, 5} → mean = (3+7+5)/3 = 15/3 = 5",
  "Median": "The median is the middle value when data is sorted. For an even count, average the two middle values.\n\nExample: {2, 5, 8, 11, 14} → median = 8",
  "Range": "Range = maximum value − minimum value. It measures the spread of data.\n\nExample: {4, 9, 15, 2} → range = 15 − 2 = 13",
  "Order of Operations": "Follow BODMAS/PEMDAS: Brackets first, then Orders (powers), then Division/Multiplication (left to right), then Addition/Subtraction (left to right).\n\nExample: 3 + 2 × 5 = 3 + 10 = 13",
}

let updated = 0

for (const [name, explanation] of Object.entries(EXPLANATIONS)) {
  const { error } = await supabase
    .from('concepts')
    .update({ explanation })
    .eq('name', name)

  if (error) {
    console.error(`  Error updating "${name}":`, error.message)
  } else {
    console.log(`  ✓ Updated: "${name}"`)
    updated++
  }
}

console.log(`\nDone. ${updated} concepts updated with explanations.`)
