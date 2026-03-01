import type { Concept } from "@/lib/types";
import type { Language } from "@/services/language";
import { AnimatedPage, PhaseProgress } from "@/components/AnimationUtils";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

const UI_LABELS: Record<Language, { phase: string; btn: string; fallback: (name: string) => string }> = {
  en: { phase: "ENCODE", btn: "I'm Ready →", fallback: (n) => `Study this concept: ${n}` },
  hi: { phase: "एन्कोड", btn: "मैं तैयार हूँ →", fallback: (n) => `इस अवधारणा का अध्ययन करें: ${n}` },
  te: { phase: "ఎన్కోడ్", btn: "నేను సిద్ధం →", fallback: (n) => `ఈ భావనను అధ్యయనం చేయండి: ${n}` },
};

/** Static localised explanations keyed by concept name then language */
const EXPLANATIONS: Record<string, Record<Language, string>> = {
  "Solving Linear Equations": {
    en: "A linear equation has one variable. To solve, isolate the variable using inverse operations.\n\nExample: 4x + 2 = 10 → 4x = 8 → x = 2",
    hi: "एक रैखिक समीकरण में एक चर होता है। हल करने के लिए, विपरीत संक्रियाओं का उपयोग करके चर को अलग करें।\n\nउदाहरण: 4x + 2 = 10 → 4x = 8 → x = 2",
    te: "రేఖీయ సమీకరణంలో ఒక చరం ఉంటుంది. సాధించడానికి, విలోమ చర్యలతో చరాన్ని వేరు చేయండి.\n\nఉదాహరణ: 4x + 2 = 10 → 4x = 8 → x = 2",
  },
  "Quadratic Equations": {
    en: "A quadratic has the form ax² + bx + c = 0. Solve by factoring, completing the square, or the quadratic formula.",
    hi: "द्विघात समीकरण ax² + bx + c = 0 रूप का होता है। गुणनखंड, वर्ग पूर्ण करके, या द्विघात सूत्र से हल करें।",
    te: "వర్గ సమీకరణం ax² + bx + c = 0 రూపంలో ఉంటుంది. కారణాంకీకరణ, వర్గం పూర్తి చేయడం లేదా వర్గ సూత్రంతో సాధించండి.",
  },
  Differentiation: {
    en: "Differentiation finds the rate of change. Power rule: d/dx(xⁿ) = nxⁿ⁻¹.",
    hi: "अवकलन परिवर्तन की दर ज्ञात करता है। घात नियम: d/dx(xⁿ) = nxⁿ⁻¹।",
    te: "అవకలనం మార్పు రేటును కనుగొంటుంది. ఘాత నియమం: d/dx(xⁿ) = nxⁿ⁻¹.",
  },
  Integration: {
    en: "Integration is the reverse of differentiation. Power rule: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.",
    hi: "समाकलन अवकलन का उल्टा है। घात नियम: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C।",
    te: "సమాకలనం అవకలనానికి విలోమం. ఘాత నియమం: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.",
  },
  "Pythagoras Theorem": {
    en: "In a right triangle: a² + b² = c² (c is the hypotenuse).",
    hi: "समकोण त्रिभुज में: a² + b² = c² (c कर्ण है)।",
    te: "లంబకోణ త్రిభుజంలో: a² + b² = c² (c కర్ణం).",
  },
  "Area of Circles": {
    en: "Area = πr². Circumference = 2πr.",
    hi: "क्षेत्रफल = πr²। परिधि = 2πr।",
    te: "వైశాల్యం = πr². చుట్టుకొలత = 2πr.",
  },
  "Area of Triangles": {
    en: "Area = ½ × base × height.",
    hi: "क्षेत्रफल = ½ × आधार × ऊँचाई।",
    te: "వైశాల్యం = ½ × భూమి × ఎత్తు.",
  },
  "SOH CAH TOA": {
    en: "sin = Opp/Hyp, cos = Adj/Hyp, tan = Opp/Adj.",
    hi: "sin = सामने/कर्ण, cos = बगल/कर्ण, tan = सामने/बगल।",
    te: "sin = ఎదురు/కర్ణం, cos = ప్రక్క/కర్ణం, tan = ఎదురు/ప్రక్క.",
  },
  "Common Angles": {
    en: "Memorise sin/cos values for 0°, 30°, 45°, 60°, 90°.",
    hi: "0°, 30°, 45°, 60°, 90° के sin/cos मान याद करें।",
    te: "0°, 30°, 45°, 60°, 90° కోసం sin/cos విలువలు గుర్తుంచుకోండి.",
  },
  "Simple Probability": {
    en: "P(event) = favourable outcomes ÷ total outcomes.",
    hi: "P(घटना) = अनुकूल परिणाम ÷ कुल परिणाम।",
    te: "P(సంఘటన) = అనుకూల ఫలితాలు ÷ మొత్తం ఫలితాలు.",
  },
  "Independent Events": {
    en: "P(A and B) = P(A) × P(B) when independent.",
    hi: "P(A और B) = P(A) × P(B) जब स्वतंत्र।",
    te: "P(A మరియు B) = P(A) × P(B) స్వతంత్రమైనప్పుడు.",
  },
  Mean: {
    en: "Mean = sum of values ÷ number of values.",
    hi: "माध्य = मानों का योग ÷ मानों की संख्या।",
    te: "సగటు = విలువల మొత్తం ÷ విలువల సంఖ్య.",
  },
  Median: {
    en: "Median = middle value when data is ordered.",
    hi: "माध्यिका = क्रमबद्ध डेटा का मध्य मान।",
    te: "మధ్యస్థం = డేటా క్రమంలో ఉన్నప్పుడు మధ్య విలువ.",
  },
  Range: {
    en: "Range = max − min.",
    hi: "परिसर = अधिकतम − न्यूनतम।",
    te: "పరిధి = గరిష్టం − కనిష్టం.",
  },
  "Order of Operations": {
    en: "Follow BODMAS: Brackets, Orders, Division/Multiplication, Addition/Subtraction.",
    hi: "BODMAS का पालन करें: कोष्ठक, घात, भाग/गुणा, जोड़/घटाव।",
    te: "BODMAS పాటించండి: కుండలీకరణాలు, ఘాతాలు, భాగహారం/గుణకారం, కూడిక/తీసివేత.",
  },
};

interface Props {
  concept: Concept;
  language: Language;
  onContinue: () => void;
}

export function EncodeView({ concept, language, onContinue }: Props) {
  const { speak, stop } = useTextToSpeech();
  const labels = UI_LABELS[language] ?? UI_LABELS.en;

  // Use localised explanation if available, else fall back to DB or generic
  const localisedExplanation =
    EXPLANATIONS[concept.name]?.[language] ??
    concept.explanation ??
    labels.fallback(concept.name);

  return (
    <AnimatedPage>
      <PhaseProgress current="ENCODE" />

      <span className="phase-badge phase-encode animate-bounce-in">
        📝 {labels.phase}
      </span>

      <p className="text-sm text-[var(--text-muted)] animate-fade-in-up delay-100">
        {concept.subject} — <span className="text-[var(--text-bright)] font-medium">{concept.name}</span>
      </p>

      <div className="max-w-lg glass-card p-7 text-center animate-fade-in-up delay-200">
        <p className="whitespace-pre-line text-lg leading-relaxed text-[var(--text-bright)]">
          {localisedExplanation}
        </p>
      </div>

      <div className="mt-4 flex justify-center gap-3 animate-fade-in-up delay-250">
        <button
          type="button"
          onClick={() => speak(localisedExplanation, language)}
          className="btn-coral glossy-btn text-sm px-4 py-2 rounded-full shadow-md shadow-black/40 transition"
        >
          ▶ Play explanation audio
        </button>
        <button
          type="button"
          onClick={stop}
          className="btn-coral glossy-btn text-sm px-4 py-2 rounded-full shadow-md shadow-black/40 transition"
        >
          ■ Stop audio
        </button>
      </div>

      <button
        onClick={onContinue}
        className="btn-primary animate-fade-in-up delay-300"
      >
        {labels.btn}
      </button>
    </AnimatedPage>
  );
}
