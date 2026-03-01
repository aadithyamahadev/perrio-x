/**
 * seed-translations.mjs
 *
 * Inserts Hindi (hi) and Telugu (te) demo translations for every question
 * in the database into the question_translations table.
 *
 * Run AFTER the question_translations migration has been applied:
 *   CREATE TABLE question_translations (
 *     tenant_id   UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
 *     question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
 *     language    TEXT NOT NULL CHECK (language IN ('hi','te')),
 *     question_text TEXT NOT NULL,
 *     hint        TEXT,
 *     PRIMARY KEY (tenant_id, question_id, language)
 *   );
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rkpboggxuqhnjbzztmoq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_nqJWyk2AE6Wt--1b19828g_ObG52Ytn'
const TENANT_ID   = '00000000-0000-0000-0000-000000000000'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Translation map: question_text (English) → { hi, te }
// Each entry: { hi: { q, h }, te: { q, h } }
// Math notation is kept identical — only the wrapper text is translated.
// ---------------------------------------------------------------------------
const TRANSLATIONS = [
  // ── Algebra: Solving Linear Equations ───────────────────────────────────
  {
    en: "Solve for x: 2x + 5 = 15",
    hi: { q: "x के लिए हल करें: 2x + 5 = 15",      h: "दोनों तरफ से 5 घटाएं, फिर 2 से भाग करें।" },
    te: { q: "x కోసం సాధించండి: 2x + 5 = 15",      h: "రెండు వైపుల నుండి 5 తీసివేయండి, తర్వాత 2తో భాగించండి." },
  },
  {
    en: "Solve for x: 3x - 7 = 8",
    hi: { q: "x के लिए हल करें: 3x - 7 = 8",        h: "7 जोड़ें, फिर 3 से भाग करें।" },
    te: { q: "x కోసం సాధించండి: 3x - 7 = 8",        h: "7 కలపండి, తర్వాత 3తో భాగించండి." },
  },
  {
    en: "Solve for x: 5x + 10 = 35",
    hi: { q: "x के लिए हल करें: 5x + 10 = 35",      h: "10 घटाएं, फिर 5 से भाग करें।" },
    te: { q: "x కోసం సాధించండి: 5x + 10 = 35",      h: "10 తీసివేయండి, తర్వాత 5తో భాగించండి." },
  },
  {
    en: "Solve for x: x/3 + 2 = 7",
    hi: { q: "x के लिए हल करें: x/3 + 2 = 7",       h: "2 घटाएं, फिर दोनों तरफ 3 से गुणा करें।" },
    te: { q: "x కోసం సాధించండి: x/3 + 2 = 7",       h: "2 తీసివేయండి, తర్వాత రెండు వైపులా 3తో గుణించండి." },
  },
  {
    en: "Solve for x: 2(x - 4) = 12",
    hi: { q: "x के लिए हल करें: 2(x - 4) = 12",     h: "विस्तार करें: 2x - 8 = 12, फिर हल करें।" },
    te: { q: "x కోసం సాధించండి: 2(x - 4) = 12",     h: "విస్తరించండి: 2x - 8 = 12, తర్వాత సాధించండి." },
  },

  // ── Algebra: Quadratic Equations ────────────────────────────────────────
  {
    en: "Find the positive solution for x: x^2 - 16 = 0",
    hi: { q: "x का धनात्मक हल ढूंढें: x^2 - 16 = 0",                                  h: "x² = 16 बनाएं, फिर धनात्मक वर्गमूल लें।" },
    te: { q: "x యొక్క ధనాత్మక సమాధానం కనుగొనండి: x^2 - 16 = 0",                     h: "x² = 16 చేయండి, తర్వాత ధనాత్మక వర్గమూలం తీసుకోండి." },
  },
  {
    en: "Expand (x + 3)(x - 3)",
    hi: { q: "(x + 3)(x - 3) का विस्तार करें",       h: "वर्ग का अंतर: (a+b)(a-b) = a² - b²" },
    te: { q: "(x + 3)(x - 3) ని విస్తరించండి",       h: "వర్గాల భేదం: (a+b)(a-b) = a² - b²" },
  },
  {
    en: "Solve x^2 + 5x + 6 = 0 (give both roots separated by comma)",
    hi: { q: "x^2 + 5x + 6 = 0 हल करें (दोनों मूल अल्पविराम से अलग करें)",           h: "ऐसी दो संख्याएं ढूंढें जो गुणा करने पर 6 और जोड़ने पर 5 दें।" },
    te: { q: "x^2 + 5x + 6 = 0 సాధించండి (రెండు మూలాలు కామాతో వేరు చేయండి)",        h: "గుణకారం 6, మొత్తం 5 అయ్యే రెండు సంఖ్యలను కనుగొనండి." },
  },
  {
    en: "What is the discriminant of x^2 - 4x + 4 = 0?",
    hi: { q: "x^2 - 4x + 4 = 0 का विविक्तकर क्या है?",                                 h: "सूत्र b² − 4ac का उपयोग करें। a, b, c की पहचान करें।" },
    te: { q: "x^2 - 4x + 4 = 0 యొక్క విభేదకం ఏమిటి?",                                  h: "b² − 4ac సూత్రం వాడండి. a, b, c గుర్తించండి." },
  },
  {
    en: "Solve x^2 - 7x + 12 = 0 (give both roots separated by comma)",
    hi: { q: "x^2 - 7x + 12 = 0 हल करें (दोनों मूल अल्पविराम से अलग करें)",          h: "ऐसी दो संख्याएं ढूंढें जो गुणा करने पर 12 और जोड़ने पर 7 दें।" },
    te: { q: "x^2 - 7x + 12 = 0 సాధించండి (రెండు మూలాలు కామాతో వేరు చేయండి)",       h: "గుణకారం 12, మొత్తం 7 అయ్యే రెండు సంఖ్యలను కనుగొనండి." },
  },

  // ── Calculus: Differentiation ────────────────────────────────────────────
  {
    en: "What is the derivative of x^2?",
    hi: { q: "x^2 का अवकलन क्या है?",               h: "घात नियम: d/dx(x^n) = n·x^(n-1)" },
    te: { q: "x^2 యొక్క అవకలనం ఏమిటి?",             h: "ఘాత నియమం: d/dx(x^n) = n·x^(n-1)" },
  },
  {
    en: "What is the derivative of 5x?",
    hi: { q: "5x का अवकलन क्या है?",                 h: "d/dx(cx) = c" },
    te: { q: "5x యొక్క అవకలనం ఏమిటి?",               h: "d/dx(cx) = c" },
  },
  {
    en: "What is the derivative of sin(x)?",
    hi: { q: "sin(x) का अवकलन क्या है?",             h: "सोचें कि किस त्रिकोणमितीय फलन से sin का अवकलन होता है।" },
    te: { q: "sin(x) యొక్క అవకలనం ఏమిటి?",           h: "ఏ త్రికోణమితి ప్రమేయం sin యొక్క అవకలనం అవుతుందో ఆలోచించండి." },
  },
  {
    en: "What is the derivative of e^x?",
    hi: { q: "e^x का अवकलन क्या है?",               h: "इस विशेष फलन का अवकलन करने पर एक अनूठा गुण है।" },
    te: { q: "e^x యొక్క అవకలనం ఏమిటి?",             h: "ఈ ప్రత్యేక ప్రమేయానికి అవకలనంలో ఒక ప్రత్యేక లక్షణం ఉంది." },
  },
  {
    en: "What is the derivative of ln(x)?",
    hi: { q: "ln(x) का अवकलन क्या है?",             h: "सोचें कि किस फलन का समाकलन ln(x) देता है।" },
    te: { q: "ln(x) యొక్క అవకలనం ఏమిటి?",           h: "ఏ ప్రమేయం యొక్క సమాకలనం ln(x) ఇస్తుందో ఆలోచించండి." },
  },
  {
    en: "What is the derivative of x^4?",
    hi: { q: "x^4 का अवकलन क्या है?",               h: "घात नियम: घातांक नीचे लाएं, 1 कम करें।" },
    te: { q: "x^4 యొక్క అవకలనం ఏమిటి?",             h: "ఘాత నియమం: ఘాతాంకాన్ని క్రిందకు తీసుకురండి, 1 తగ్గించండి." },
  },

  // ── Calculus: Integration ────────────────────────────────────────────────
  {
    en: "What is the integral of 2x dx?",
    hi: { q: "2x dx का समाकलन क्या है?",             h: "घात नियम: ∫x^n dx = x^(n+1)/(n+1) + C" },
    te: { q: "2x dx యొక్క సమాకలనం ఏమిటి?",           h: "ఘాత నియమం: ∫x^n dx = x^(n+1)/(n+1) + C" },
  },
  {
    en: "What is the integral of cos(x) dx?",
    hi: { q: "cos(x) dx का समाकलन क्या है?",         h: "कौन सा त्रिकोणमितीय फलन का अवकलन cos(x) है? + C मत भूलें।" },
    te: { q: "cos(x) dx యొక్క సమాకలనం ఏమిటి?",       h: "ఏ త్రికోణమితి ప్రమేయం యొక్క అవకలనం cos(x)? + C మరవకండి." },
  },
  {
    en: "What is the integral of e^x dx?",
    hi: { q: "e^x dx का समाकलन क्या है?",           h: "यह विशेष फलन अपने आप में समाकलित होता है। + C मत भूलें।" },
    te: { q: "e^x dx యొక్క సమాకలనం ఏమిటి?",         h: "ఈ ప్రత్యేక ప్రమేయం తనకు తాను సమాకలనమవుతుంది. + C మరవకండి." },
  },
  {
    en: "What is the integral of 3 dx?",
    hi: { q: "3 dx का समाकलन क्या है?",             h: "स्थिरांक का समाकलन: ∫k dx = kx + C" },
    te: { q: "3 dx యొక్క సమాకలనం ఏమిటి?",           h: "స్థిరాంకం యొక్క సమాకలనం: ∫k dx = kx + C" },
  },
  {
    en: "What is the integral of x^3 dx?",
    hi: { q: "x^3 dx का समाकलन क्या है?",           h: "विलोम घात नियम: घातांक 1 बढ़ाएं, नए से भाग करें।" },
    te: { q: "x^3 dx యొక్క సమాకలనం ఏమిటి?",         h: "విలోమ ఘాత నియమం: ఘాతాంకం 1 పెంచండి, కొత్త దానితో భాగించండి." },
  },

  // ── Geometry: Pythagoras Theorem ─────────────────────────────────────────
  {
    en: "In a right triangle with legs 3 and 4, what is the length of the hypotenuse?",
    hi: { q: "3 और 4 भुजाओं वाले समकोण त्रिभुज में कर्ण की लंबाई क्या है?",          h: "c = √(a² + b²) का उपयोग करें। दोनों भुजाओं का वर्ग करके जोड़ें।" },
    te: { q: "3 మరియు 4 భుజాలు గల లంబకోణ త్రిభుజంలో కర్ణం పొడవెంత?",               h: "c = √(a² + b²) వాడండి. రెండు భుజాలను వర్గం చేసి కలపండి." },
  },
  {
    en: "In a right triangle with legs 5 and 12, what is the hypotenuse?",
    hi: { q: "5 और 12 भुजाओं वाले समकोण त्रिभुज में कर्ण क्या है?",                   h: "c = √(a² + b²) का उपयोग करें। दोनों भुजाओं का वर्ग करके जोड़ें।" },
    te: { q: "5 మరియు 12 భుజాలు గల లంబకోణ త్రిభుజంలో కర్ణమెంత?",                    h: "c = √(a² + b²) వాడండి. రెండు భుజాలను వర్గం చేసి కలపండి." },
  },
  {
    en: "In a right triangle with hypotenuse 10 and one leg 6, find the other leg",
    hi: { q: "कर्ण 10 और एक भुजा 6 वाले समकोण त्रिभुज में दूसरी भुजा ढूंढें",        h: "b = √(c² − a²) का उपयोग करें।" },
    te: { q: "కర్ణం 10, ఒక భుజం 6 గల లంబకోణ త్రిభుజంలో మరొక భుజం కనుగొనండి",       h: "b = √(c² − a²) వాడండి." },
  },
  {
    en: "In a right triangle with legs 8 and 15, what is the hypotenuse?",
    hi: { q: "8 और 15 भुजाओं वाले समकोण त्रिभुज में कर्ण क्या है?",                   h: "c = √(a² + b²) का उपयोग करें। दोनों भुजाओं का वर्ग करके जोड़ें।" },
    te: { q: "8 మరియు 15 భుజాలు గల లంబకోణ త్రిభుజంలో కర్ణమెంత?",                    h: "c = √(a² + b²) వాడండి. రెండు భుజాలను వర్గం చేసి కలపండి." },
  },

  // ── Geometry: Area of Circles ─────────────────────────────────────────────
  {
    en: "Calculate the area of a circle with radius 2 (in terms of pi)",
    hi: { q: "त्रिज्या 2 वाले वृत्त का क्षेत्रफल ज्ञात करें (pi के पदों में)",        h: "A = πr² का उपयोग करें। r = 2 रखें।" },
    te: { q: "వ్యాసార్ధం 2 ఉన్న వృత్తం యొక్క వైశాల్యం లెక్కించండి (pi పరంగా)",       h: "A = πr² వాడండి. r = 2 పెట్టండి." },
  },
  {
    en: "Calculate the area of a circle with radius 7 (in terms of pi)",
    hi: { q: "त्रिज्या 7 वाले वृत्त का क्षेत्रफल ज्ञात करें (pi के पदों में)",        h: "A = πr² का उपयोग करें। r = 7 रखें।" },
    te: { q: "వ్యాసార్ధం 7 ఉన్న వృత్తం యొక్క వైశాల్యం లెక్కించండి (pi పరంగా)",       h: "A = πr² వాడండి. r = 7 పెట్టండి." },
  },
  {
    en: "A circle has diameter 10. What is its area (in terms of pi)?",
    hi: { q: "एक वृत्त का व्यास 10 है। उसका क्षेत्रफल (pi के पदों में) क्या है?",     h: "पहले व्यास से त्रिज्या निकालें, फिर A = πr² का उपयोग करें।" },
    te: { q: "ఒక వృత్తం యొక్క వ్యాసం 10. దాని వైశాల్యం (pi పరంగా) ఏమిటి?",           h: "ముందు వ్యాసం నుండి వ్యాసార్ధం కనుగొనండి, తర్వాత A = πr² వాడండి." },
  },
  {
    en: "A circle has area 16pi. What is its diameter?",
    hi: { q: "एक वृत्त का क्षेत्रफल 16pi है। उसका व्यास क्या है?",                    h: "A = πr² से r² निकालें, फिर r ढूंढें, फिर व्यास = 2r।" },
    te: { q: "ఒక వృత్తం యొక్క వైశాల్యం 16pi. దాని వ్యాసం ఏమిటి?",                    h: "A = πr² నుండి r² కనుగొనండి, తర్వాత r, తర్వాత వ్యాసం = 2r." },
  },

  // ── Geometry: Area of Triangles ──────────────────────────────────────────
  {
    en: "Calculate the area of a triangle with base 10 and height 5",
    hi: { q: "आधार 10 और ऊंचाई 5 वाले त्रिभुज का क्षेत्रफल ज्ञात करें",              h: "A = ½ × आधार × ऊंचाई = ½ × 10 × 5" },
    te: { q: "పాదం 10 మరియు ఎత్తు 5 ఉన్న త్రిభుజం యొక్క వైశాల్యం లెక్కించండి",       h: "A = ½ × పాదం × ఎత్తు = ½ × 10 × 5" },
  },
  {
    en: "Calculate the area of a triangle with base 6 and height 9",
    hi: { q: "आधार 6 और ऊंचाई 9 वाले त्रिभुज का क्षेत्रफल ज्ञात करें",               h: "A = ½ × आधार × ऊंचाई का उपयोग करें।" },
    te: { q: "పాదం 6 మరియు ఎత్తు 9 ఉన్న త్రిభుజం యొక్క వైశాల్యం లెక్కించండి",        h: "A = ½ × పాదం × ఎత్తు వాడండి." },
  },
  {
    en: "A triangle has area 30 and height 6. What is the base?",
    hi: { q: "एक त्रिभुज का क्षेत्रफल 30 और ऊंचाई 6 है। आधार क्या है?",               h: "A = ½ × b × h को b के लिए पुनर्व्यवस्थित करें।" },
    te: { q: "ఒక త్రిభుజం యొక్క వైశాల్యం 30, ఎత్తు 6. పాదం ఏమిటి?",                  h: "A = ½ × b × h ను b కోసం పునర్వ్యవస్థీకరించండి." },
  },
  {
    en: "Calculate the area of an equilateral triangle with side 4 (in terms of sqrt)",
    hi: { q: "भुजा 4 वाले समबाहु त्रिभुज का क्षेत्रफल ज्ञात करें (sqrt के पदों में)", h: "A = (√3/4)s² का उपयोग करें। s = 4 रखें।" },
    te: { q: "భుజం 4 ఉన్న సమబాహు త్రిభుజం యొక్క వైశాల్యం లెక్కించండి (sqrt పరంగా)", h: "A = (√3/4)s² వాడండి. s = 4 పెట్టండి." },
  },

  // ── Trigonometry: SOH CAH TOA ────────────────────────────────────────────
  {
    en: "Which trig function is Opposite / Hypotenuse?",
    hi: { q: "कौन सा त्रिकोणमितीय फलन विपरीत/कर्ण है?",                               h: "SOH: sin = विपरीत/कर्ण" },
    te: { q: "ఏ త్రికోణమితి ప్రమేయం వ్యతిరేక/కర్ణం?",                                  h: "SOH: sin = వ్యతిరేకం/కర్ణం" },
  },
  {
    en: "In a right triangle, opp = 3, hyp = 5. What is sin(angle)?",
    hi: { q: "समकोण त्रिभुज में, विपरीत = 3, कर्ण = 5। sin(कोण) क्या है?",            h: "SOH: sin = विपरीत/कर्ण। मान रखें।" },
    te: { q: "లంబకోణ త్రిభుజంలో, వ్యతిరేకం = 3, కర్ణం = 5. sin(కోణం) ఏమిటి?",        h: "SOH: sin = వ్యతిరేకం/కర్ణం. విలువలు పెట్టండి." },
  },
  {
    en: "In a right triangle, adj = 4, hyp = 5. What is cos(angle)?",
    hi: { q: "समकोण त्रिभुज में, समीपवर्ती = 4, कर्ण = 5। cos(कोण) क्या है?",         h: "CAH: cos = समीपवर्ती/कर्ण। मान रखें।" },
    te: { q: "లంబకోణ త్రిభుజంలో, ఆసన్నం = 4, కర్ణం = 5. cos(కోణం) ఏమిటి?",           h: "CAH: cos = ఆసన్నం/కర్ణం. విలువలు పెట్టండి." },
  },
  {
    en: "In a right triangle, opp = 3, adj = 4. What is tan(angle)?",
    hi: { q: "समकोण त्रिभुज में, विपरीत = 3, समीपवर्ती = 4। tan(कोण) क्या है?",       h: "TOA: tan = विपरीत/समीपवर्ती। मान रखें।" },
    te: { q: "లంబకోణ త్రిభుజంలో, వ్యతిరేకం = 3, ఆసన్నం = 4. tan(కోణం) ఏమిటి?",       h: "TOA: tan = వ్యతిరేకం/ఆసన్నం. విలువలు పెట్టండి." },
  },

  // ── Trigonometry: Common Angles ──────────────────────────────────────────
  {
    en: "What is sin(90) degrees?",
    hi: { q: "sin(90) डिग्री क्या है?",             h: "90° पर इकाई वृत्त की y-निर्देशांक क्या है?" },
    te: { q: "sin(90) డిగ్రీలు ఏమిటి?",             h: "90° వద్ద ఏకమాన వృత్తం యొక్క y-నిర్దేశాంకం ఏమిటి?" },
  },
  {
    en: "What is cos(0) degrees?",
    hi: { q: "cos(0) डिग्री क्या है?",              h: "0° पर इकाई वृत्त की x-निर्देशांक क्या है?" },
    te: { q: "cos(0) డిగ్రీలు ఏమిటి?",              h: "0° వద్ద ఏకమాన వృత్తం యొక్క x-నిర్దేశాంకం ఏమిటి?" },
  },
  {
    en: "What is tan(45) degrees?",
    hi: { q: "tan(45) डिग्री क्या है?",             h: "tan = sin/cos। 45° पर sin और cos का अनुपात क्या है?" },
    te: { q: "tan(45) డిగ్రీలు ఏమిటి?",             h: "tan = sin/cos. 45° వద్ద sin మరియు cos నిష్పత్తి ఏమిటి?" },
  },
  {
    en: "What is sin(30) degrees?",
    hi: { q: "sin(30) डिग्री क्या है?",             h: "30° एक मानक कोण है। 30-60-90 त्रिभुज अनुपात सोचें।" },
    te: { q: "sin(30) డిగ్రీలు ఏమిటి?",             h: "30° ఒక ప్రమాణ కోణం. 30-60-90 త్రిభుజ నిష్పత్తులు ఆలోచించండి." },
  },
  {
    en: "What is cos(60) degrees?",
    hi: { q: "cos(60) डिग्री क्या है?",             h: "60° एक मानक कोण है। 30-60-90 त्रिभुज अनुपात सोचें।" },
    te: { q: "cos(60) డిగ్రీలు ఏమిటి?",             h: "60° ఒక ప్రమాణ కోణం. 30-60-90 త్రిభుజ నిష్పత్తులు ఆలోచించండి." },
  },
  {
    en: "What is sin(0) degrees?",
    hi: { q: "sin(0) डिग्री क्या है?",              h: "0° पर इकाई वृत्त की y-निर्देशांक क्या है?" },
    te: { q: "sin(0) డిగ్రీలు ఏమిటి?",              h: "0° వద్ద ఏకమాన వృత్తం యొక్క y-నిర్దేశాంకం ఏమిటి?" },
  },
  {
    en: "What is cos(90) degrees?",
    hi: { q: "cos(90) डिग्री क्या है?",             h: "90° पर इकाई वृत्त की x-निर्देशांक क्या है?" },
    te: { q: "cos(90) డిగ్రీలు ఏమిటి?",             h: "90° వద్ద ఏకమాన వృత్తం యొక్క x-నిర్దేశాంకం ఏమిటి?" },
  },

  // ── Probability: Simple Probability ─────────────────────────────────────
  {
    en: "Probability of rolling a 6 on a 6-sided die (fraction)",
    hi: { q: "6 फलक वाले पासे पर 6 आने की प्रायिकता (भिन्न)",                         h: "1 अनुकूल परिणाम, 6 कुल परिणाम।" },
    te: { q: "6 వైపుల పాచికపై 6 రావడానికి సంభావ్యత (భిన్నం)",                          h: "1 అనుకూల ఫలితం, 6 మొత్తం ఫలితాలు." },
  },
  {
    en: "Probability of rolling an even number on a 6-sided die (fraction)",
    hi: { q: "6 फलक वाले पासे पर सम संख्या आने की प्रायिकता (भिन्न)",                 h: "सम संख्याएं: 2,4,6 → 6 में से 3" },
    te: { q: "6 వైపుల పాచికపై సమ సంఖ్య రావడానికి సంభావ్యత (భిన్నం)",                  h: "సమ సంఖ్యలు: 2,4,6 → 6లో 3" },
  },
  {
    en: "Probability of picking a vowel from the word MATH (fraction)",
    hi: { q: "MATH शब्द से स्वर चुनने की प्रायिकता (भिन्न)",                           h: "MATH में केवल A स्वर है। 4 में से 1।" },
    te: { q: "MATH పదం నుండి అచ్చు ఎంచుకోవడానికి సంభావ్యత (భిన్నం)",                  h: "MATH లో A మాత్రమే అచ్చు. 4లో 1." },
  },
  {
    en: "Probability of drawing a red card from a standard deck (fraction)",
    hi: { q: "मानक ताश से लाल पत्ता खींचने की प्रायिकता (भिन्न)",                     h: "52 में से 26 लाल पत्ते।" },
    te: { q: "ప్రమాణ పేకలో నుండి ఎర్ర పత్తా తీయడానికి సంభావ్యత (భిన్నం)",              h: "52లో 26 ఎర్ర పత్తాలు." },
  },

  // ── Probability: Independent Events ─────────────────────────────────────
  {
    en: "Probability of flipping two heads in a row (fraction)",
    hi: { q: "लगातार दो बार शीर्ष आने की प्रायिकता (भिन्न)",                          h: "P(H) × P(H) = 1/2 × 1/2" },
    te: { q: "వరుసగా రెండు సార్లు తల రావడానికి సంభావ్యత (భిన్నం)",                     h: "P(H) × P(H) = 1/2 × 1/2" },
  },
  {
    en: "Probability of rolling a 1 then a 2 on a fair die (fraction)",
    hi: { q: "निष्पक्ष पासे पर पहले 1 फिर 2 आने की प्रायिकता (भिन्न)",               h: "P(1) × P(2) = 1/6 × 1/6" },
    te: { q: "నిజాయితీ పాచికపై మొదట 1 తర్వాత 2 రావడానికి సంభావ్యత (భిన్నం)",          h: "P(1) × P(2) = 1/6 × 1/6" },
  },
  {
    en: "A fair coin is flipped twice. Probability of tail then head (fraction)?",
    hi: { q: "एक सिक्का दो बार उछाला जाता है। पहले पुच्छ फिर शीर्ष की प्रायिकता (भिन्न)?", h: "P(T) × P(H) = 1/2 × 1/2" },
    te: { q: "నాణెం రెండుసార్లు వేయబడింది. తర్వాత తల రావడానికి సంభావ్యత (భిన్నం)?",   h: "P(T) × P(H) = 1/2 × 1/2" },
  },
  {
    en: "Two dice are rolled. Probability both show 6 (fraction)?",
    hi: { q: "दो पासे फेंके जाते हैं। दोनों पर 6 आने की प्रायिकता (भिन्न)?",          h: "स्वतंत्र घटनाओं के लिए व्यक्तिगत प्रायिकताओं को गुणा करें।" },
    te: { q: "రెండు పాచికలు వేయబడ్డాయి. రెండూ 6 చూపించే సంభావ్యత (భిన్నం)?",         h: "స్వతంత్ర సంఘటనల కోసం వ్యక్తిగత సంభావ్యతలను గుణించండి." },
  },

  // ── Statistics: Mean ─────────────────────────────────────────────────────
  {
    en: "Calculate the mean of 2, 4, 6, 8, 10",
    hi: { q: "2, 4, 6, 8, 10 का माध्य ज्ञात करें",    h: "सभी मानों को जोड़ें और संख्या (5) से भाग दें।" },
    te: { q: "2, 4, 6, 8, 10 యొక్క సగటు లెక్కించండి",  h: "అన్ని విలువలు కలపండి, వ్యక్తుల సంఖ్య (5) తో భాగించండి." },
  },
  {
    en: "Calculate the mean of 3, 7, 11, 15",
    hi: { q: "3, 7, 11, 15 का माध्य ज्ञात करें",       h: "सभी मानों को जोड़ें और संख्या से भाग दें।" },
    te: { q: "3, 7, 11, 15 యొక్క సగటు లెక్కించండి",    h: "అన్ని విలువలు కలపండి, వ్యక్తుల సంఖ్యతో భాగించండి." },
  },
  {
    en: "Calculate the mean of 100, 200, 300",
    hi: { q: "100, 200, 300 का माध्य ज्ञात करें",      h: "माध्य = योग ÷ संख्या। तीनों को जोड़ें और 3 से भाग दें।" },
    te: { q: "100, 200, 300 యొక్క సగటు లెక్కించండి",   h: "సగటు = మొత్తం ÷ వ్యక్తుల సంఖ్య. మూడింటిని కలపండి, 3తో భాగించండి." },
  },
  {
    en: "Calculate the mean of 1, 2, 3, 4, 5, 6, 7, 8, 9",
    hi: { q: "1, 2, 3, 4, 5, 6, 7, 8, 9 का माध्य ज्ञात करें", h: "सभी 9 मानों को जोड़ें, फिर 9 से भाग दें।" },
    te: { q: "1, 2, 3, 4, 5, 6, 7, 8, 9 యొక్క సగటు లెక్కించండి", h: "9 విలువలన్నీ కలపండి, తర్వాత 9తో భాగించండి." },
  },

  // ── Statistics: Median ───────────────────────────────────────────────────
  {
    en: "Calculate the median of 1, 3, 3, 6, 7, 8, 9",
    hi: { q: "1, 3, 3, 6, 7, 8, 9 का मध्यिका ज्ञात करें",  h: "विषम संख्या, क्रमबद्ध। बीच वाला मान चुनें।" },
    te: { q: "1, 3, 3, 6, 7, 8, 9 యొక్క మధ్యస్థం లెక్కించండి", h: "బేసి సంఖ్య, క్రమబద్ధం. మధ్య విలువ ఎంచుకోండి." },
  },
  {
    en: "Calculate the median of 3, 5, 7, 9, 11",
    hi: { q: "3, 5, 7, 9, 11 का मध्यिका ज्ञात करें",        h: "विषम संख्या, पहले से क्रमबद्ध। बीच वाला मान चुनें।" },
    te: { q: "3, 5, 7, 9, 11 యొక్క మధ్యస్థం లెక్కించండి",    h: "బేసి సంఖ్య, ముందే క్రమబద్ధం. మధ్య విలువ ఎంచుకోండి." },
  },
  {
    en: "Calculate the median of 10, 20, 30, 40",
    hi: { q: "10, 20, 30, 40 का मध्यिका ज्ञात करें",         h: "सम संख्या → बीच के दो मानों का औसत निकालें।" },
    te: { q: "10, 20, 30, 40 యొక్క మధ్యస్థం లెక్కించండి",     h: "సమ సంఖ్య → మధ్య రెండు విలువల సగటు కనుగొనండి." },
  },
  {
    en: "Calculate the median of 4, 1, 7, 2, 9",
    hi: { q: "4, 1, 7, 2, 9 का मध्यिका ज्ञात करें",          h: "पहले क्रमबद्ध करें, फिर बीच वाला मान चुनें।" },
    te: { q: "4, 1, 7, 2, 9 యొక్క మధ్యస్థం లెక్కించండి",      h: "ముందు క్రమబద్ధం చేయండి, తర్వాత మధ్య విలువ ఎంచుకోండి." },
  },

  // ── Statistics: Range ────────────────────────────────────────────────────
  {
    en: "Calculate the range of {5, 12, 3, 20}",
    hi: { q: "{5, 12, 3, 20} का परास ज्ञात करें",          h: "परास = अधिकतम − न्यूनतम। सबसे बड़ा और सबसे छोटा मान ढूंढें।" },
    te: { q: "{5, 12, 3, 20} యొక్క వ్యాప్తి లెక్కించండి",   h: "వ్యాప్తి = గరిష్టం − కనిష్టం. అతి పెద్ద మరియు అతి చిన్న విలువలు కనుగొనండి." },
  },
  {
    en: "Calculate the range of {3, 8, 1, 12, 5}",
    hi: { q: "{3, 8, 1, 12, 5} का परास ज्ञात करें",         h: "परास = अधिकतम − न्यूनतम। सबसे बड़ा और छोटा ढूंढें।" },
    te: { q: "{3, 8, 1, 12, 5} యొక్క వ్యాప్తి లెక్కించండి",  h: "వ్యాప్తి = గరిష్టం − కనిష్టం. అతి పెద్ద మరియు అతి చిన్న విలువలు కనుగొనండి." },
  },
  {
    en: "Calculate the range of {50, 50, 50}",
    hi: { q: "{50, 50, 50} का परास ज्ञात करें",             h: "जब सभी मान समान हों, तो अधिकतम − न्यूनतम क्या होगा?" },
    te: { q: "{50, 50, 50} యొక్క వ్యాప్తి లెక్కించండి",      h: "అన్ని విలువలు సమానం అయినప్పుడు, గరిష్టం − కనిష్టం ఏమిటి?" },
  },
  {
    en: "Calculate the range of {-3, 0, 4, 7}",
    hi: { q: "{-3, 0, 4, 7} का परास ज्ञात करें",            h: "परास = अधिकतम − न्यूनतम। ऋणात्मक संख्याओं से सावधान रहें।" },
    te: { q: "{-3, 0, 4, 7} యొక్క వ్యాప్తి లెక్కించండి",     h: "వ్యాప్తి = గరిష్టం − కనిష్టం. ఋణాత్మక సంఖ్యలతో జాగ్రత్తగా ఉండండి." },
  },

  // ── Arithmetic: Order of Operations ─────────────────────────────────────
  {
    en: "Calculate 2 + 3 * 4",
    hi: { q: "2 + 3 * 4 की गणना करें",           h: "BODMAS/PEMDAS: पहले गुणा करें, फिर जोड़ें।" },
    te: { q: "2 + 3 * 4 లెక్కించండి",             h: "BODMAS/PEMDAS: ముందు గుణకారం, తర్వాత కలపండి." },
  },
  {
    en: "Calculate 8 / 2 + 3",
    hi: { q: "8 / 2 + 3 की गणना करें",           h: "BODMAS/PEMDAS: पहले भाग, फिर जोड़ें।" },
    te: { q: "8 / 2 + 3 లెక్కించండి",             h: "BODMAS/PEMDAS: ముందు భాగహారం, తర్వాత కలపండి." },
  },
  {
    en: "Calculate 3 + 4^2",
    hi: { q: "3 + 4^2 की गणना करें",             h: "BODMAS/PEMDAS: पहले घातांक, फिर जोड़ें।" },
    te: { q: "3 + 4^2 లెక్కించండి",               h: "BODMAS/PEMDAS: ముందు ఘాతాంకం, తర్వాత కలపండి." },
  },
  {
    en: "Calculate (6 + 2) / (2 * 2)",
    hi: { q: "(6 + 2) / (2 * 2) की गणना करें",   h: "दोनों कोष्ठक पहले हल करें, फिर भाग दें।" },
    te: { q: "(6 + 2) / (2 * 2) లెక్కించండి",     h: "రెండు బ్రాకెట్లను ముందు సాధించండి, తర్వాత భాగించండి." },
  },
  {
    en: "Calculate 2^3 - 4 / 2",
    hi: { q: "2^3 - 4 / 2 की गणना करें",         h: "BODMAS/PEMDAS: पहले घातांक, फिर भाग, फिर घटाएं।" },
    te: { q: "2^3 - 4 / 2 లెక్కించండి",           h: "BODMAS/PEMDAS: ముందు ఘాతాంకం, తర్వాత భాగహారం, తర్వాత తీసివేయండి." },
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

console.log(`\nSeeding ${TRANSLATIONS.length} questions × 2 languages = ${TRANSLATIONS.length * 2} rows\n`)

let inserted = 0
let skipped  = 0
let missing  = 0
let errors   = 0

for (const entry of TRANSLATIONS) {
  // Look up question id by English text
  const { data: rows } = await supabase
    .from('questions')
    .select('id, question_text')
    .eq('question_text', entry.en)

  if (!rows || rows.length === 0) {
    console.warn(`  ⊘ Question not found in DB: "${entry.en.slice(0, 60)}…"`)
    missing++
    continue
  }

  for (const row of rows) {
    for (const lang of ['hi', 'te']) {
      const t = entry[lang]
      const { error } = await supabase
        .from('question_translations')
        .upsert(
          {
            tenant_id:     TENANT_ID,
            question_id:   row.id,
            language:      lang,
            question_text: t.q,
            hint:          t.h ?? null,
          },
          { onConflict: 'tenant_id,question_id,language' }
        )

      if (error) {
        // If the table doesn't exist yet, surface a clear message
        if (error.message.includes('question_translations') || error.code === '42P01') {
          console.error('\n✗ Table "question_translations" does not exist.\n')
          console.error('  ── STEP 1 ─────────────────────────────────────────────────────────')
          console.error('  Open the Supabase SQL Editor for your project:')
          console.error('  https://supabase.com/dashboard/project/rkpboggxuqhnjbzztmoq/sql/new')
          console.error('')
          console.error('  Paste and run the migration file:')
          console.error('  supabase/migrations/20260226_question_translations.sql')
          console.error('')
          console.error('  Or paste this SQL directly:\n')
          console.error(`CREATE TABLE IF NOT EXISTS question_translations (
  tenant_id     UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  question_id   UUID REFERENCES questions(id) ON DELETE CASCADE,
  language      TEXT NOT NULL CHECK (language IN ('hi', 'te')),
  question_text TEXT NOT NULL,
  hint          TEXT,
  PRIMARY KEY (tenant_id, question_id, language)
);
CREATE INDEX IF NOT EXISTS idx_qtrans_question_id ON question_translations(question_id);
CREATE INDEX IF NOT EXISTS idx_qtrans_tenant_lang ON question_translations(tenant_id, language);
ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all" ON question_translations;
CREATE POLICY "public_all" ON question_translations FOR ALL USING (true) WITH CHECK (true);`)
          console.error('')
          console.error('  ── STEP 2 ─────────────────────────────────────────────────────────')
          console.error('  After running the SQL, re-run:  node scripts/seed-translations.mjs\n')
          process.exit(1)
        }
        console.error(`  ✗ [${lang}] "${entry.en.slice(0, 40)}": ${error.message}`)
        errors++
      } else {
        console.log(`  ✓ [${lang}] "${entry.en.slice(0, 55)}"`)
        inserted++
      }
    }
  }
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`  ✓ Inserted/updated : ${inserted}`)
console.log(`  ⊘ Questions missing: ${missing}`)
console.log(`  ✗ Errors           : ${errors}`)
console.log(`${'─'.repeat(50)}\n`)
