import type { BillingNotice } from '../commerce/billing-notices';
import type { PackLabel } from '../format/languages';

/**
 * One billing notice as the platform texts it to an owner's phone (`M12-40`, `F1-38`): a
 * registered template, per language, with `{company}` and `{link}` slots. `whileProtected` is the
 * second template a company inside its price-protection horizon reads (`M12-41`), `null` for a
 * notice that discloses no forfeiture (`disclosesForfeiture`).
 */
export interface BillingNoticeText {
  readonly text: PackLabel;
  readonly whileProtected: PackLabel | null;
}

/**
 * The market's out-of-app stack for billing notices, SMS leg (`M12-40`). PARTIAL on purpose: a
 * notice whose template is not yet registered is absent, and its SMS does not go — in-app and push
 * carry the ladder meanwhile (`F1-38`, activation not scope).
 */
export type BillingNoticeTexts = Readonly<Partial<Record<BillingNotice, BillingNoticeText>>>;

const FORFEITS = {
  en: " If the plan halts, your launch price ends and a restart bills at today's prices.",
  hi: ' अगर प्लान रुक गया, तो आपकी लॉन्च कीमत खत्म हो जाएगी और दोबारा शुरू करने पर आज की कीमत लगेगी।',
  mr: ' प्लॅन थांबल्यास तुमची लॉन्च किंमत संपेल आणि पुन्हा सुरू केल्यावर आजची किंमत लागेल.',
} as const;

const FORFEITED = {
  en: " Your launch price has ended; reactivating bills at today's prices.",
  hi: ' आपकी लॉन्च कीमत खत्म हो गई है; दोबारा शुरू करने पर आज की कीमत लगेगी।',
  mr: ' तुमची लॉन्च किंमत संपली आहे; पुन्हा सुरू केल्यावर आजची किंमत लागेल.',
} as const;

type Words = { readonly en: string; readonly hi: string; readonly mr: string };

/** A notice's facts, then — for a protected company — the forfeiture, then the one way out. */
function told(facts: Words, way: Words, forfeiture: Words | null): BillingNoticeText {
  const join = (extra: Words | null): PackLabel => ({
    en: `${facts.en}${extra?.en ?? ''} ${way.en}`,
    hi: `${facts.hi}${extra?.hi ?? ''} ${way.hi}`,
    mr: `${facts.mr}${extra?.mr ?? ''} ${way.mr}`,
  });
  return { text: join(null), whileProtected: forfeiture === null ? null : join(forfeiture) };
}

const PAY_OR_UPDATE: Words = {
  en: 'Pay or update your payment method: {link}',
  hi: 'भुगतान करें या भुगतान का तरीका बदलें: {link}',
  mr: 'पेमेंट करा किंवा पेमेंटची पद्धत बदला: {link}',
};

const PICK_A_PLAN: Words = {
  en: 'Pick a plan to keep creating: {link}',
  hi: 'नया काम जारी रखने के लिए प्लान चुनें: {link}',
  mr: 'नवीन काम चालू ठेवण्यासाठी प्लॅन निवडा: {link}',
};

/**
 * India's texts. The day-4 text names the voice agent, AI roof detection and team invites: the
 * set the matrix pauses at `past_due_metered_paused`, pinned by a test, so a matrix change fails
 * until this text is revised and registered again.
 */
export const IN_BILLING_NOTICE_TEXTS: BillingNoticeTexts = {
  payment_failed: told(
    {
      en: "HelioGrid: the payment for {company}'s plan failed.",
      hi: 'HelioGrid: {company} के प्लान का भुगतान विफल हो गया।',
      mr: 'HelioGrid: {company} च्या प्लॅनचे पेमेंट अयशस्वी झाले.',
    },
    PAY_OR_UPDATE,
    FORFEITS,
  ),
  payment_reminder: told(
    {
      en: "HelioGrid: {company}'s plan payment is still due. Everything works for now.",
      hi: 'HelioGrid: {company} के प्लान का भुगतान अभी बाकी है। अभी सब कुछ चल रहा है।',
      mr: 'HelioGrid: {company} च्या प्लॅनचे पेमेंट अजून बाकी आहे. सध्या सर्व काही चालू आहे.',
    },
    PAY_OR_UPDATE,
    FORFEITS,
  ),
  metered_paused: told(
    {
      en: "HelioGrid: {company}'s plan is unpaid, so the voice agent, AI roof detection and team invites are paused. Everything else still works.",
      hi: 'HelioGrid: {company} के प्लान का भुगतान नहीं हुआ है, इसलिए वॉइस एजेंट, AI रूफ डिटेक्शन और टीम आमंत्रण रुके हुए हैं। बाकी सब कुछ चल रहा है।',
      mr: 'HelioGrid: {company} च्या प्लॅनचे पेमेंट झालेले नाही, म्हणून व्हॉइस एजंट, AI रूफ डिटेक्शन आणि टीम आमंत्रणे थांबवली आहेत. बाकी सर्व काही चालू आहे.',
    },
    PAY_OR_UPDATE,
    FORFEITS,
  ),
  final_warning: told(
    {
      en: "HelioGrid: {company}'s plan halts within a day if it stays unpaid. Your data stays safe and readable.",
      hi: 'HelioGrid: भुगतान न होने पर {company} का प्लान एक दिन के भीतर रुक जाएगा। आपका डेटा सुरक्षित रहेगा और पढ़ा जा सकेगा।',
      mr: 'HelioGrid: पेमेंट न झाल्यास {company} चा प्लॅन एका दिवसात थांबेल. तुमचा डेटा सुरक्षित राहील आणि वाचता येईल.',
    },
    { en: 'Pay now: {link}', hi: 'अभी भुगतान करें: {link}', mr: 'आता पेमेंट करा: {link}' },
    FORFEITS,
  ),
  halted: told(
    {
      en: "HelioGrid: {company}'s plan is halted because it is unpaid. Reading, exports, customer links and billing still work.",
      hi: 'HelioGrid: भुगतान न होने से {company} का प्लान रुक गया है। पढ़ना, एक्सपोर्ट, ग्राहक लिंक और बिलिंग अब भी चलते हैं।',
      mr: 'HelioGrid: पेमेंट न झाल्याने {company} चा प्लॅन थांबला आहे. वाचणे, एक्सपोर्ट, ग्राहक लिंक आणि बिलिंग अजूनही चालू आहेत.',
    },
    {
      en: 'Reactivate with one payment: {link}',
      hi: 'एक भुगतान से दोबारा शुरू करें: {link}',
      mr: 'एका पेमेंटने पुन्हा सुरू करा: {link}',
    },
    FORFEITED,
  ),
  win_back: told(
    {
      en: "HelioGrid: {company}'s data is safe and readable.",
      hi: 'HelioGrid: {company} का डेटा सुरक्षित है और पढ़ा जा सकता है।',
      mr: 'HelioGrid: {company} चा डेटा सुरक्षित आहे आणि वाचता येतो.',
    },
    {
      en: "Reactivate any time with one payment, at today's prices: {link}",
      hi: 'कभी भी एक भुगतान से, आज की कीमत पर, दोबारा शुरू करें: {link}',
      mr: 'कधीही एका पेमेंटने, आजच्या किमतीवर, पुन्हा सुरू करा: {link}',
    },
    null,
  ),
  trial_half_way: told(
    {
      en: "HelioGrid: {company}'s free trial has 7 days left.",
      hi: 'HelioGrid: {company} के फ्री ट्रायल में 7 दिन बाकी हैं।',
      mr: 'HelioGrid: {company} च्या फ्री ट्रायलचे 7 दिवस बाकी आहेत.',
    },
    PICK_A_PLAN,
    null,
  ),
  trial_ending: told(
    {
      en: "HelioGrid: {company}'s free trial ends in 2 days.",
      hi: 'HelioGrid: {company} का फ्री ट्रायल 2 दिन में खत्म होगा।',
      mr: 'HelioGrid: {company} ची फ्री ट्रायल 2 दिवसांत संपेल.',
    },
    PICK_A_PLAN,
    null,
  ),
  trial_ended: told(
    {
      en: "HelioGrid: {company}'s free trial has ended. Your data stays safe and readable.",
      hi: 'HelioGrid: {company} का फ्री ट्रायल खत्म हो गया है। आपका डेटा सुरक्षित है और पढ़ा जा सकता है।',
      mr: 'HelioGrid: {company} ची फ्री ट्रायल संपली आहे. तुमचा डेटा सुरक्षित आहे आणि वाचता येतो.',
    },
    PICK_A_PLAN,
    null,
  ),
};
