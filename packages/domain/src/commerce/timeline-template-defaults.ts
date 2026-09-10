import type { PackLabel } from '../format/languages';

/** One phase of the customer-facing project timeline (`M01-52`): a name and one sentence. */
export interface TimelinePhase {
  readonly name: PackLabel;
  readonly description: PackLabel;
}

/**
 * The platform's timeline template (`M01-52`, `M01-28`): `M08-08`'s chain after Won, in the
 * customer's words, so a tenant that never opens settings still sends a proposal whose timeline
 * matches the stages its project will actually pass. Three launch languages here, as the pack's
 * message templates are, because the effective read serves a document from the server.
 */
export const DEFAULT_TIMELINE_PHASES: readonly TimelinePhase[] = [
  {
    name: { en: 'Material ordered', hi: 'सामग्री ऑर्डर की गई', mr: 'साहित्य ऑर्डर केले' },
    description: {
      en: 'Panels, inverter and structure are ordered for your site.',
      hi: 'आपकी साइट के लिए पैनल, इन्वर्टर और स्ट्रक्चर ऑर्डर किए जाते हैं।',
      mr: 'तुमच्या साइटसाठी पॅनेल, इन्व्हर्टर आणि स्ट्रक्चर ऑर्डर केले जातात.',
    },
  },
  {
    name: { en: 'Dispatched', hi: 'डिस्पैच', mr: 'डिस्पॅच' },
    description: {
      en: 'Materials leave the warehouse for your site.',
      hi: 'सामग्री गोदाम से आपकी साइट के लिए रवाना होती है।',
      mr: 'साहित्य गोदामातून तुमच्या साइटकडे रवाना होते.',
    },
  },
  {
    name: { en: 'Installation', hi: 'इंस्टॉलेशन', mr: 'इन्स्टॉलेशन' },
    description: {
      en: 'The structure, panels and wiring are installed on your roof.',
      hi: 'आपकी छत पर स्ट्रक्चर, पैनल और वायरिंग लगाई जाती है।',
      mr: 'तुमच्या छतावर स्ट्रक्चर, पॅनेल आणि वायरिंग बसवली जाते.',
    },
  },
  {
    name: {
      en: 'Electrical work and metering',
      hi: 'इलेक्ट्रिकल कार्य और मीटरिंग',
      mr: 'इलेक्ट्रिकल काम आणि मीटरिंग',
    },
    description: {
      en: 'The inverter is connected and the meter application is filed.',
      hi: 'इन्वर्टर जोड़ा जाता है और मीटर के लिए आवेदन किया जाता है।',
      mr: 'इन्व्हर्टर जोडला जातो आणि मीटरसाठी अर्ज केला जातो.',
    },
  },
  {
    name: { en: 'Utility inspection', hi: 'बिजली कंपनी का निरीक्षण', mr: 'वीज कंपनीची तपासणी' },
    description: {
      en: 'The electricity utility inspects and approves the installation.',
      hi: 'बिजली कंपनी इंस्टॉलेशन का निरीक्षण कर उसे मंज़ूरी देती है।',
      mr: 'वीज कंपनी इन्स्टॉलेशनची तपासणी करून मंजुरी देते.',
    },
  },
  {
    name: { en: 'Commissioning', hi: 'कमीशनिंग', mr: 'कमिशनिंग' },
    description: {
      en: 'The system is switched on and starts generating.',
      hi: 'सिस्टम चालू किया जाता है और बिजली बनाना शुरू करता है।',
      mr: 'सिस्टम सुरू केली जाते आणि वीजनिर्मिती सुरू होते.',
    },
  },
  {
    name: { en: 'Incentive claim', hi: 'प्रोत्साहन दावा', mr: 'प्रोत्साहन दावा' },
    description: {
      en: 'The incentive claim is filed on your behalf.',
      hi: 'आपकी ओर से प्रोत्साहन राशि का दावा दायर किया जाता है।',
      mr: 'तुमच्या वतीने प्रोत्साहन रकमेचा दावा दाखल केला जातो.',
    },
  },
  {
    name: { en: 'Handover', hi: 'हैंडओवर', mr: 'हस्तांतरण' },
    description: {
      en: 'Documents, warranties and the monitoring login are handed over to you.',
      hi: 'दस्तावेज़, वारंटी और मॉनिटरिंग लॉगिन आपको सौंपे जाते हैं।',
      mr: 'कागदपत्रे, वॉरंटी आणि मॉनिटरिंग लॉगिन तुम्हाला सुपूर्द केले जातात.',
    },
  },
];
