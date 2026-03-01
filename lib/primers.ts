import type { Concept } from "@/lib/types";
import type { Language } from "@/services/language";

// ---------------------------------------------------------------------------
// English primers (canonical)
// ---------------------------------------------------------------------------

const PRIMERS: Record<string, string> = {
  "Solving Linear Equations":
    "A linear equation contains one unknown variable raised to the power of 1. The goal is to isolate the variable on one side of the equation by performing the same operation on both sides. Inverse operations undo each other: addition undoes subtraction, and multiplication undoes division.\n\nExample: Solve 3x + 5 = 20. First subtract 5 from both sides: 3x = 15. Then divide both sides by 3: x = 5. Always check your answer by substituting back — 3(5) + 5 = 20. ✓\n\nMultiple-step equations follow the same logic — work from the outside inward, undoing each operation one at a time in reverse order.",

  "Quadratic Equations":
    "A quadratic equation has the form ax² + bx + c = 0, where a ≠ 0. There are three main methods to solve them.\n\nFactoring: rewrite as (x + p)(x + q) = 0, then set each bracket to zero. Example: x² + 5x + 6 = 0 factors as (x + 2)(x + 3) = 0, giving x = −2 or x = −3.\n\nCompleting the square: rewrite one side as a perfect square trinomial.\n\nThe quadratic formula works for any quadratic: x = (−b ± √(b²−4ac)) / 2a. The discriminant b²−4ac tells you how many solutions exist: positive = two real solutions, zero = one repeated solution, negative = no real solutions.",

  Differentiation:
    "Differentiation measures how quickly a function changes at any given point — it gives the instantaneous rate of change, or the gradient of a curve at a specific x value.\n\nThe power rule: d/dx(xⁿ) = nxⁿ⁻¹. Example: if f(x) = x³, then f′(x) = 3x². For a sum, differentiate each term separately: d/dx(x³ + 4x² − 7) = 3x² + 8x.\n\nSpecial rules: the derivative of sin(x) is cos(x); the derivative of eˣ is eˣ. The chain rule handles composite functions: d/dx[(2x+1)⁴] = 4(2x+1)³ · 2 = 8(2x+1)³.\n\nDifferentiation is used to find turning points, rates of change, and to optimise real-world problems.",

  Integration:
    "Integration is the reverse of differentiation and has two main uses: finding antiderivatives and calculating the area under a curve.\n\nThe power rule: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C, where C is the constant of integration — always include it for indefinite integrals. Example: ∫3x² dx = x³ + C.\n\nFor definite integrals, substitute the upper and lower bounds and subtract: ∫₁³ x² dx = [x³/3]₁³ = 9 − 1/3 = 26/3 ≈ 8.67.\n\nSpecial cases: ∫sin(x) dx = −cos(x) + C; ∫eˣ dx = eˣ + C. If the curve dips below the x-axis, that region contributes a negative area, so split the integral at each x-intercept when finding total area.",

  "Pythagoras Theorem":
    "Pythagoras' theorem states that in any right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides: a² + b² = c², where c is always opposite the right angle.\n\nExample: a triangle with legs 3 and 4 — what is the hypotenuse? 3² + 4² = 9 + 16 = 25, so c = √25 = 5. This is the famous 3-4-5 Pythagorean triple. Other common triples: 5-12-13 and 8-15-17.\n\nTo find a missing leg: if c = 10 and a = 6, then b² = 100 − 36 = 64, so b = 8.\n\nIn 3D, the diagonal of a box with dimensions a, b, c is √(a² + b² + c²).",

  "Area of Circles":
    "The area of a circle is A = πr², where r is the radius (the distance from the centre to the edge) and π ≈ 3.14159.\n\nExample: a circle with radius 5 cm has area A = π × 5² = 25π ≈ 78.54 cm². If you are given the diameter d, first halve it: r = d/2. Example: diameter = 12 m, so r = 6 m, giving A = π × 36 ≈ 113.1 m².\n\nThe circumference (perimeter) uses a different formula: C = 2πr or C = πd. A semicircle has area ½πr². An annulus (ring shape) has area π(R² − r²) where R and r are the outer and inner radii respectively.",

  "Area of Triangles":
    "The area of a triangle is A = ½ × base × height, where the height is the perpendicular distance from the base to the opposite vertex — not the slant side.\n\nExample: a triangle with base 8 cm and perpendicular height 5 cm: A = ½ × 8 × 5 = 20 cm².\n\nWhen you know two sides and the included angle, use: A = ½ab sin(C). Example: sides of 6 m and 9 m with included angle 30°: A = ½ × 6 × 9 × sin(30°) = 27 × 0.5 = 13.5 m².\n\nHeron's formula works when all three sides are known: A = √[s(s−a)(s−b)(s−c)] where s = (a+b+c)/2. For right triangles, the two legs serve directly as the base and height.",

  "SOH CAH TOA":
    "SOH CAH TOA is a mnemonic for the three primary trigonometric ratios in a right-angled triangle. SOH: sin(θ) = Opposite ÷ Hypotenuse. CAH: cos(θ) = Adjacent ÷ Hypotenuse. TOA: tan(θ) = Opposite ÷ Adjacent.\n\nThe 'opposite' side is directly across from angle θ, the 'adjacent' is next to θ (but not the hypotenuse), and the hypotenuse is always the longest side, opposite the right angle.\n\nExample: θ = 30°, hypotenuse = 10. Opposite = 10 × sin(30°) = 5; adjacent = 10 × cos(30°) ≈ 8.66.\n\nTo find an angle, use inverse functions: if sin(θ) = 0.6 then θ = sin⁻¹(0.6) ≈ 36.9°. SOH CAH TOA only applies to right-angled triangles. For non-right triangles, use the sine rule or cosine rule.",

  "Common Angles":
    "Certain angles appear so frequently that their exact trigonometric values should be memorised.\n\n0°: sin = 0, cos = 1, tan = 0.\n30°: sin = ½, cos = √3/2, tan = 1/√3.\n45°: sin = cos = 1/√2 ≈ 0.707, tan = 1.\n60°: sin = √3/2, cos = ½, tan = √3.\n90°: sin = 1, cos = 0, tan = undefined.\n\nA helpful pattern: sin values for 0°, 30°, 45°, 60°, 90° follow √0/2, √1/2, √2/2, √3/2, √4/2.\n\nExample: find the exact value of 2cos(60°) + sin(30°) = 2 × ½ + ½ = 1.5. These exact values avoid rounding errors in proofs and extend with sign changes across all four quadrants using the CAST diagram.",

  "Simple Probability":
    "Probability measures how likely an event is to occur, expressed as a number between 0 (impossible) and 1 (certain). The basic formula is: P(event) = number of favourable outcomes ÷ total number of equally likely outcomes.\n\nExample: rolling a 4 on a fair six-sided die — 1 favourable outcome out of 6 total, so P(4) = 1/6 ≈ 0.167. Probability can be written as a fraction, decimal, or percentage.\n\nThe complement rule states P(not A) = 1 − P(A). Example: P(not rolling a 4) = 1 − 1/6 = 5/6.\n\nFor combined events without replacement, the total number of outcomes decreases with each draw. Always check: the sum of probabilities of all mutually exclusive outcomes must equal exactly 1.",

  "Independent Events":
    "Two events are independent if the outcome of one has absolutely no effect on the probability of the other. For independent events, the multiplication rule applies: P(A and B) = P(A) × P(B).\n\nExample: flipping a coin and rolling a die are independent. P(Heads and 6) = ½ × 1/6 = 1/12.\n\nThis extends to more events: P(A and B and C) = P(A) × P(B) × P(C). Example: probability of rolling three consecutive sixes = (1/6)³ = 1/216 ≈ 0.005.\n\nContrast with dependent events, where the second probability changes after the first — those require the conditional probability formula P(A and B) = P(A) × P(B|A). Always ask: does the first event change what's available for the second?",

  Mean:
    "The mean (arithmetic average) is calculated by summing all values and dividing by how many there are: mean = Σx / n.\n\nExample: the scores 4, 7, 9, 3, 12 have a sum of 35, with 5 values, so mean = 35 / 5 = 7.\n\nThe mean is sensitive to outliers. If the dataset were 4, 7, 9, 3, 50, the mean jumps to 14.6 even though most values cluster below 10. For skewed distributions, the median is often preferred.\n\nThe weighted mean assigns different importance to values: mean = Σ(w·x) / Σw. Example: a student scores 60% on a 30%-weighted test and 80% on a 70%-weighted test — weighted mean = (0.3×60 + 0.7×80) = 18 + 56 = 74%.",

  Median:
    "The median is the middle value of a dataset arranged in ascending order. For an odd count, it is the exact middle item. For an even count, average the two middle items.\n\nExample (odd count): 3, 5, 7, 9, 12 — the median is 7 (the 3rd of 5 values).\nExample (even count): 4, 6, 8, 10 — the median is (6 + 8) / 2 = 7.\n\nThe median is resistant to outliers, making it a better measure of centre for skewed data. Example: house prices {200k, 220k, 230k, 240k, 1.2M} — the mean is 418k but the median is 230k, which far better represents the typical price.\n\nIn grouped frequency tables, the median is estimated using cumulative frequencies and linear interpolation between class boundaries.",

  Range:
    "The range is the simplest measure of spread in a dataset: range = maximum value − minimum value.\n\nExample: temperatures recorded over a week — 12°C, 15°C, 9°C, 20°C, 17°C, 11°C, 18°C. Maximum = 20°C, minimum = 9°C, so range = 20 − 9 = 11°C.\n\nThe range is quick to calculate but highly sensitive to outliers. Adding just one extreme value — say 45°C — changes the range to 36°C even though the rest of the data is unchanged.\n\nFor a more robust measure of spread, use the interquartile range (IQR) = Q3 − Q1, which captures the middle 50% of data and ignores extremes. The range is useful for quick comparisons but should always be used alongside other statistics like standard deviation.",

  "Order of Operations":
    "When an expression contains multiple operations, perform them in a fixed order to get the correct result. The rule is BODMAS (UK) or PEMDAS (US): Brackets/Parentheses first, then Orders/Exponents, then Division and Multiplication (left to right), finally Addition and Subtraction (left to right).\n\nExample: evaluate 3 + 4 × 2² − (5 − 1).\nStep 1 — Brackets: (5 − 1) = 4 → 3 + 4 × 2² − 4.\nStep 2 — Orders: 2² = 4 → 3 + 4 × 4 − 4.\nStep 3 — Multiplication: 4 × 4 = 16 → 3 + 16 − 4.\nStep 4 — Addition/Subtraction left to right: 19 − 4 = 15.\n\nThe most common mistake is adding before multiplying. Always multiply and divide before adding and subtracting, unless brackets force otherwise.",
};

export function getPrimerText(concept: Pick<Concept, "subject" | "name">, language: Language = "en"): string {
  if (language === "hi" && PRIMERS_HI[concept.name]) return PRIMERS_HI[concept.name];
  if (language === "te" && PRIMERS_TE[concept.name]) return PRIMERS_TE[concept.name];
  return (
    PRIMERS[concept.name] ??
    `This question covers ${concept.name} in ${concept.subject}.`
  );
}

// ---------------------------------------------------------------------------
// Hindi primers
// ---------------------------------------------------------------------------

const PRIMERS_HI: Record<string, string> = {
  "Solving Linear Equations":
    "एक रैखिक समीकरण में एक अज्ञात चर होता है जिसकी घात 1 होती है। लक्ष्य चर को समीकरण के एक तरफ अलग करना है — दोनों तरफ एक ही संक्रिया करें। जोड़ घटाव को रद्द करता है, और गुणा भाग को रद्द करता है।\n\nउदाहरण: 3x + 5 = 20 हल करें। पहले दोनों तरफ से 5 घटाएँ: 3x = 15। फिर दोनों तरफ 3 से भाग दें: x = 5। हमेशा उत्तर की जाँच करें — 3(5) + 5 = 20। ✓",

  "Quadratic Equations":
    "द्विघात समीकरण का रूप ax² + bx + c = 0 होता है, जहाँ a ≠ 0। तीन मुख्य विधियाँ हैं।\n\nगुणनखंड: (x + p)(x + q) = 0 के रूप में लिखें, फिर प्रत्येक कोष्ठक को शून्य करें। उदाहरण: x² + 5x + 6 = 0, (x + 2)(x + 3) = 0, x = −2 या x = −3।\n\nद्विघात सूत्र: x = (−b ± √(b²−4ac)) / 2a। विविक्तकर b²−4ac बताता है कि कितने हल हैं।",

  Differentiation:
    "अवकलन मापता है कि किसी बिंदु पर फलन कितनी तेजी से बदलता है — यह वक्र की तात्कालिक ढलान देता है।\n\nघात नियम: d/dx(xⁿ) = nxⁿ⁻¹। उदाहरण: f(x) = x³, तो f′(x) = 3x²। योग के लिए, प्रत्येक पद को अलग-अलग अवकलित करें: d/dx(x³ + 4x²) = 3x² + 8x।\n\nविशेष: sin(x) का अवकलज cos(x) है; eˣ का अवकलज eˣ है।",

  Integration:
    "समाकलन अवकलन का उल्टा है — प्रतिअवकलज ज्ञात करना और वक्र के नीचे का क्षेत्रफल निकालना।\n\nघात नियम: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C। उदाहरण: ∫3x² dx = x³ + C।\n\nनिश्चित समाकल के लिए, ऊपरी और निचली सीमा रखकर घटाएँ। विशेष: ∫sin(x) dx = −cos(x) + C; ∫eˣ dx = eˣ + C।",

  "Pythagoras Theorem":
    "पाइथागोरस प्रमेय कहता है कि समकोण त्रिभुज में कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है: a² + b² = c²।\n\nउदाहरण: भुजाएँ 3 और 4 — कर्ण? 3² + 4² = 25, c = 5। प्रसिद्ध त्रिक: 3-4-5, 5-12-13, 8-15-17।\n\nकिसी भुजा को ज्ञात करने के लिए: c = 10, a = 6 → b² = 100 − 36 = 64, b = 8।",

  "Area of Circles":
    "वृत्त का क्षेत्रफल A = πr² है, जहाँ r त्रिज्या है और π ≈ 3.14159।\n\nउदाहरण: त्रिज्या 5 cm → A = 25π ≈ 78.54 cm²। यदि व्यास d दिया है तो r = d/2।\n\nपरिधि: C = 2πr। अर्धवृत्त का क्षेत्रफल ½πr²। वलय का क्षेत्रफल π(R² − r²)।",

  "Area of Triangles":
    "त्रिभुज का क्षेत्रफल A = ½ × आधार × ऊँचाई है, जहाँ ऊँचाई लम्बवत दूरी है।\n\nउदाहरण: आधार 8 cm, ऊँचाई 5 cm → A = ½ × 8 × 5 = 20 cm²।\n\nदो भुजाएँ और बीच का कोण: A = ½ab sin(C)। हेरॉन का सूत्र: A = √[s(s−a)(s−b)(s−c)] जहाँ s = (a+b+c)/2।",

  "SOH CAH TOA":
    "SOH CAH TOA समकोण त्रिभुज में तीन त्रिकोणमितीय अनुपातों का स्मरण सूत्र है। SOH: sin(θ) = सामने / कर्ण। CAH: cos(θ) = बगल / कर्ण। TOA: tan(θ) = सामने / बगल।\n\nउदाहरण: θ = 30°, कर्ण = 10। सामने = 10 × sin(30°) = 5।\n\nकोण ज्ञात करने के लिए: sin(θ) = 0.6 → θ = sin⁻¹(0.6) ≈ 36.9°।",

  "Common Angles":
    "कुछ कोणों के त्रिकोणमितीय मान याद रखने चाहिए।\n\n0°: sin=0, cos=1। 30°: sin=½, cos=√3/2। 45°: sin=cos=1/√2। 60°: sin=√3/2, cos=½। 90°: sin=1, cos=0।\n\nपैटर्न: 0°,30°,45°,60°,90° के sin = √0/2, √1/2, √2/2, √3/2, √4/2।\n\nउदाहरण: 2cos(60°) + sin(30°) = 2×½ + ½ = 1.5।",

  "Simple Probability":
    "प्रायिकता मापती है कि कोई घटना कितनी संभावित है — 0 (असंभव) से 1 (निश्चित) तक। मूल सूत्र: P = अनुकूल परिणाम ÷ कुल परिणाम।\n\nउदाहरण: पासे पर 4 आने की प्रायिकता = 1/6। पूरक नियम: P(A नहीं) = 1 − P(A)।\n\nसभी परस्पर अनन्य परिणामों की प्रायिकताओं का योग = 1।",

  "Independent Events":
    "दो घटनाएँ स्वतंत्र हैं यदि एक का परिणाम दूसरी की प्रायिकता को प्रभावित नहीं करता। गुणन नियम: P(A और B) = P(A) × P(B)।\n\nउदाहरण: सिक्का और पासा → P(चित और 6) = ½ × 1/6 = 1/12।\n\nतीन लगातार छक्के: (1/6)³ = 1/216। आश्रित घटनाओं में: P(A और B) = P(A) × P(B|A)।",

  Mean:
    "माध्य (औसत) = सभी मानों का योग ÷ मानों की संख्या: mean = Σx / n।\n\nउदाहरण: 4, 7, 9, 3, 12 → योग 35, n=5, माध्य = 7।\n\nमाध्य बाहरी मानों (outliers) से प्रभावित होता है। भारित माध्य: mean = Σ(w·x) / Σw।",

  Median:
    "माध्यिका आरोही क्रम में मध्य मान है। विषम संख्या में बिल्कुल बीच का मान; सम संख्या में दो मध्य मानों का औसत।\n\nउदाहरण: 3, 5, 7, 9, 12 → माध्यिका = 7। 4, 6, 8, 10 → माध्यिका = (6+8)/2 = 7।\n\nमाध्यिका बाहरी मानों से कम प्रभावित होती है।",

  Range:
    "परिसर = अधिकतम मान − न्यूनतम मान। यह फैलाव का सबसे सरल माप है।\n\nउदाहरण: 12, 15, 9, 20, 17, 11, 18 → परिसर = 20 − 9 = 11।\n\nपरिसर बाहरी मानों से बहुत प्रभावित होता है। बेहतर माप: अन्तर-चतुर्थक परिसर (IQR) = Q3 − Q1।",

  "Order of Operations":
    "जब किसी व्यंजक में कई संक्रियाएँ हों, BODMAS क्रम का पालन करें: कोष्ठक, घात, भाग और गुणा (बाएँ से दाएँ), जोड़ और घटाव (बाएँ से दाएँ)।\n\nउदाहरण: 3 + 4 × 2² − (5−1)। कोष्ठक: 4 → 3 + 4 × 2² − 4। घात: 4 → 3 + 4×4 − 4। गुणा: 16 → 3 + 16 − 4 = 15।",
};

// ---------------------------------------------------------------------------
// Telugu primers
// ---------------------------------------------------------------------------

const PRIMERS_TE: Record<string, string> = {
  "Solving Linear Equations":
    "రేఖీయ సమీకరణంలో ఒక తెలియని చరం ఉంటుంది, దాని ఘాతం 1. లక్ష్యం చరాన్ని ఒక వైపుకు వేరు చేయడం — రెండు వైపులా ఒకే చర్య చేయండి.\n\nఉదాహరణ: 3x + 5 = 20 సాధించండి. మొదట 5 తీసివేయండి: 3x = 15. తర్వాత 3తో భాగించండి: x = 5. సమాధానాన్ని తనిఖీ చేయండి — 3(5)+5=20. ✓",

  "Quadratic Equations":
    "వర్గ సమీకరణం ax² + bx + c = 0 రూపంలో ఉంటుంది, a ≠ 0. మూడు ప్రధాన పద్ధతులు.\n\nకారణాంకీకరణ: (x+p)(x+q) = 0 గా రాయండి. ఉదాహరణ: x²+5x+6=0 → (x+2)(x+3)=0, x=−2 లేదా x=−3.\n\nవర్గ సూత్రం: x = (−b ± √(b²−4ac)) / 2a. విచక్షణం b²−4ac ఎన్ని పరిష్కారాలు ఉన్నాయో చెబుతుంది.",

  Differentiation:
    "అవకలనం ఒక బిందువు వద్ద ఫంక్షన్ ఎంత వేగంగా మారుతుందో కొలుస్తుంది — ఇది తక్షణ వాలును ఇస్తుంది.\n\nఘాత నియమం: d/dx(xⁿ) = nxⁿ⁻¹. ఉదాహరణ: f(x) = x³, f′(x) = 3x². ప్రతి పదాన్ని విడిగా అవకలనం చేయండి.\n\nప్రత్యేకం: sin(x) అవకలనం cos(x); eˣ అవకలనం eˣ.",

  Integration:
    "సమాకలనం అవకలనానికి విలోమం — ప్రతి-అవకలనం కనుగొనడం మరియు వక్రం కింద వైశాల్యం లెక్కించడం.\n\nఘాత నియమం: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. ఉదాహరణ: ∫3x² dx = x³ + C.\n\nనిర్దిష్ట సమాకలనం: ఎగువ, దిగువ హద్దులు ఉంచి తీసివేయండి.",

  "Pythagoras Theorem":
    "పైథాగరస్ సిద్ధాంతం: లంబకోణ త్రిభుజంలో కర్ణం వర్గం = ఇతర రెండు భుజాల వర్గాల మొత్తం: a² + b² = c².\n\nఉదాహరణ: భుజాలు 3 మరియు 4 → 9 + 16 = 25, c = 5. ప్రసిద్ధ త్రయాలు: 3-4-5, 5-12-13.\n\nభుజను కనుగొనడానికి: c=10, a=6 → b² = 64, b = 8.",

  "Area of Circles":
    "వృత్తం వైశాల్యం A = πr², ఇక్కడ r వ్యాసార్ధం, π ≈ 3.14159.\n\nఉదాహరణ: r = 5 cm → A = 25π ≈ 78.54 cm². వ్యాసం d ఇస్తే r = d/2.\n\nచుట్టుకొలత: C = 2πr. అర్ధవృత్తం: ½πr². వలయం: π(R² − r²).",

  "Area of Triangles":
    "త్రిభుజం వైశాల్యం A = ½ × భూమి × ఎత్తు, ఇక్కడ ఎత్తు లంబ దూరం.\n\nఉదాహరణ: భూమి 8 cm, ఎత్తు 5 cm → A = 20 cm².\n\nరెండు భుజాలు మరియు మధ్య కోణం: A = ½ab sin(C). హీరోన్ సూత్రం: A = √[s(s−a)(s−b)(s−c)].",

  "SOH CAH TOA":
    "SOH CAH TOA లంబకోణ త్రిభుజంలో మూడు త్రికోణమితి నిష్పత్తుల జ్ఞాపక సూత్రం. SOH: sin(θ) = ఎదురు / కర్ణం. CAH: cos(θ) = ప్రక్క / కర్ణం. TOA: tan(θ) = ఎదురు / ప్రక్క.\n\nఉదాహరణ: θ=30°, కర్ణం=10 → ఎదురు = 5.\n\nకోణం కనుగొనడానికి: sin⁻¹(0.6) ≈ 36.9°.",

  "Common Angles":
    "కొన్ని కోణాల విలువలు గుర్తుంచుకోవాలి.\n\n0°: sin=0, cos=1. 30°: sin=½, cos=√3/2. 45°: sin=cos=1/√2. 60°: sin=√3/2, cos=½. 90°: sin=1, cos=0.\n\nపాటర్న్: sin 0°,30°,45°,60°,90° = √0/2, √1/2, √2/2, √3/2, √4/2.\n\nఉదాహరణ: 2cos(60°)+sin(30°) = 1.5.",

  "Simple Probability":
    "సంభావ్యత ఒక సంఘటన ఎంత సాధ్యమో కొలుస్తుంది — 0 (అసాధ్యం) నుండి 1 (ఖచ్చితం). సూత్రం: P = అనుకూల ఫలితాలు ÷ మొత్తం ఫలితాలు.\n\nఉదాహరణ: పాచిక పై 4 రావడం = 1/6. పూరక నియమం: P(A కాదు) = 1 − P(A).\n\nపరస్పర ప్రత్యేక ఫలితాల సంభావ్యతల మొత్తం = 1.",

  "Independent Events":
    "రెండు సంఘటనలు స్వతంత్రం అంటే ఒక దాని ఫలితం మరొక దాని సంభావ్యతను ప్రభావితం చేయదు. గుణకార నియమం: P(A మరియు B) = P(A) × P(B).\n\nఉదాహరణ: నాణెం మరియు పాచిక → P(బొమ్మ మరియు 6) = ½ × 1/6 = 1/12.\n\nమూడు వరుస 6లు: (1/6)³ = 1/216.",

  Mean:
    "సగటు = అన్ని విలువల మొత్తం ÷ విలువల సంఖ్య: mean = Σx / n.\n\nఉదాహరణ: 4, 7, 9, 3, 12 → మొత్తం 35, n=5, సగటు = 7.\n\nసగటు బాహ్య విలువలతో ప్రభావితమవుతుంది. భారిత సగటు: mean = Σ(w·x) / Σw.",

  Median:
    "మధ్యస్థం ఆరోహణ క్రమంలో మధ్య విలువ. బేసి సంఖ్యలో మధ్య విలువ; సరి సంఖ్యలో రెండు మధ్య విలువల సగటు.\n\nఉదాహరణ: 3,5,7,9,12 → మధ్యస్థం = 7. 4,6,8,10 → (6+8)/2 = 7.\n\nమధ్యస్థం బాహ్య విలువలతో తక్కువగా ప్రభావితమవుతుంది.",

  Range:
    "పరిధి = గరిష్ట విలువ − కనిష్ట విలువ. ఇది వ్యాప్తికి సరళమైన కొలత.\n\nఉదాహరణ: 12,15,9,20,17,11,18 → పరిధి = 20−9 = 11.\n\nపరిధి బాహ్య విలువలతో ఎక్కువగా ప్రభావితమవుతుంది. మెరుగైన కొలత: IQR = Q3 − Q1.",

  "Order of Operations":
    "అనేక చర్యలు ఉన్నప్పుడు BODMAS క్రమం పాటించండి: కుండలీకరణాలు, ఘాతాలు, భాగహారం & గుణకారం (ఎడమ→కుడి), కూడిక & తీసివేత (ఎడమ→కుడి).\n\nఉదాహరణ: 3+4×2²−(5−1). కుండలీకరణాలు: 4 → 3+4×4−4. గుణకారం: 16 → 3+16−4 = 15.",
};
