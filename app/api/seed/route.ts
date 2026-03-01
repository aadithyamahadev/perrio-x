import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SAMPLE_QUESTIONS = [
  { subject: "Algebra", name: "Solving Linear Equations", question: "Solve for x: 2x + 5 = 15", answer: "5" },
  { subject: "Algebra", name: "Solving Linear Equations", question: "Solve for x: 3x - 7 = 8", answer: "5" },
  { subject: "Algebra", name: "Quadratic Equations", question: "Find the positive solution for x: x^2 - 16 = 0", answer: "4" },
  { subject: "Algebra", name: "Quadratic Equations", question: "Expand (x + 3)(x - 3)", answer: "x^2 - 9" },
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of x^2?", answer: "2x" },
  { subject: "Calculus", name: "Differentiation", question: "What is the derivative of 5x?", answer: "5" },
  { subject: "Calculus", name: "Integration", question: "What is the integral of 2x dx?", answer: "x^2 + C" },
  { subject: "Geometry", name: "Pythagoras Theorem", question: "In a right triangle with legs 3 and 4, what is the length of the hypotenuse?", answer: "5" },
  { subject: "Geometry", name: "Area of Circles", question: "Calculate the area of a circle with radius 2 (in terms of pi)", answer: "4pi" },
  { subject: "Geometry", name: "Area of Triangles", question: "Calculate the area of a triangle with base 10 and height 5", answer: "25" },
  { subject: "Trigonometry", name: "SOH CAH TOA", question: "Which trig function is Opposite / Hypotenuse?", answer: "sin" },
  { subject: "Trigonometry", name: "Common Angles", question: "What is sin(90) degrees?", answer: "1" },
  { subject: "Trigonometry", name: "Common Angles", question: "What is cos(0) degrees?", answer: "1" },
  { subject: "Trigonometry", name: "Common Angles", question: "What is tan(45) degrees?", answer: "1" },
  { subject: "Probability", name: "Simple Probability", question: "Probability of rolling a 6 on a 6-sided die (fraction)", answer: "1/6" },
  { subject: "Probability", name: "Independent Events", question: "Probability of flipping two heads in a row (fraction)", answer: "1/4" },
  { subject: "Statistics", name: "Mean", question: "Calculate the mean of 2, 4, 6, 8, 10", answer: "6" },
  { subject: "Statistics", name: "Median", question: "Calculate the median of 1, 3, 3, 6, 7, 8, 9", answer: "6" },
  { subject: "Statistics", name: "Range", question: "Calculate the range of {5, 12, 3, 20}", answer: "17" },
  { subject: "Arithmetic", name: "Order of Operations", question: "Calculate 2 + 3 * 4", answer: "14" },
];

export async function GET() {
  const results = [];

  for (const q of SAMPLE_QUESTIONS) {
    // Check if concept exists
    let { data: concept } = await supabase
      .from("concepts")
      .select("id")
      .eq("name", q.name)
      .eq("subject", q.subject)
      .single();

    // Create concept if not exists
    if (!concept) {
      const { data: newConcept, error: conceptError } = await supabase
        .from("concepts")
        .insert({ subject: q.subject, name: q.name })
        .select()
        .single();
      
      if (conceptError) {
        return NextResponse.json({ error: conceptError.message }, { status: 500 });
      }
      concept = newConcept;
    }

    if (concept) {
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert({
          concept_id: concept.id,
          question_text: q.question,
          correct_answer: q.answer
        })
        .select();

      if (questionError) {
        console.error("Error inserting question", questionError);
      } else {
        results.push(questionData);
      }
    }
  }

  return NextResponse.json({ 
    message: `Seeded ${results.length} questions`, 
    results 
  });
}
