import { describe, expect, it } from 'vitest';
import { companyProfileWords } from '../src/copy/company-profile-words';
import { createTranslator } from '../src/runtime';
import { AT_SIGNUP } from './company-profile-facts';

/**
 * The words of the company profile's setup life (`SCR-M01-05`). Both platforms draw what this
 * returns and write none themselves. The board renders in Hindi and Marathi: the title, the lede,
 * the five part titles, `Name only`, `Not added`, the group, the three card lines, the size's
 * hint, the act, its spoken name and the re-seed line — copied from it. Every other Hindi and
 * Marathi line below is drafted for the localisation pass: the two other ledes, `{city} only`,
 * `Added`, `Answered`, `Not declared`, `Check the format`, `From your signup`, the address and
 * bank fields and their lines, `(optional)`, the format-check sentence, the market-defaults line,
 * the loading, failed-read and failed-save words, and the letterhead's three.
 */
const ACT_AT_REST = {
  waiting: null,
  secondary: null,
  secondarySpoken: null,
  alert: null,
  line: null,
};

const WORDS = {
  en: {
    title: 'Your company profile',
    lede: 'On every proposal, invoice and customer link · asked for once',
    parts: [
      { key: 'identity', title: 'Logo and company name', standing: 'Name only', mark: 'open' },
      { key: 'address', title: 'Address', standing: 'Pune only', mark: 'open' },
      { key: 'tax', title: 'Tax registration', standing: 'Not added', mark: 'open' },
      { key: 'bank', title: 'Bank details', standing: 'Not added', mark: 'open' },
      { key: 'declarations', title: 'What you sell', standing: 'Answered', mark: 'met' },
    ],
    identity: { companyName: 'Company name', fromSignup: 'From your signup' },
    address: {
      street: 'Street address',
      streetExample: 'Building, street, area',
      city: 'City',
      fromSignup: 'From your signup',
      postalCode: 'PIN code',
      postalCodeExample: '411038',
      purpose: 'Shown to customers on every document',
    },
    tax: {
      label: 'GSTIN (optional)',
      format: '15 characters · like 27ABCDE1234F1Z5',
      error: null,
      checked:
        "We check the format against your market's rules — never with the issuing authority.",
    },
    bank: {
      bankName: 'Bank name',
      bankNameExample: 'HDFC Bank',
      accountHolder: 'Account holder',
      accountNumber: 'Account number',
      accountNumberExample: 'Your current account',
      routing: 'IFSC',
      routingExample: 'HDFC0001234',
      checked:
        "We check the format against your market's rules — never with the issuing authority.",
      purpose: 'On your invoices · never used to move your money',
    },
    declarations: {
      group: 'What you mostly sell',
      options: [
        { value: 'residential', title: 'Residential', description: 'Homes and housing societies' },
        {
          value: 'ci',
          title: 'Commercial & industrial (C&I)',
          description: 'Factories, offices, warehouses',
        },
        { value: 'both', title: 'Both', description: 'You sell to either' },
      ],
      sizeLabel: 'Typical system size',
      unit: 'kWp',
      sizeHint: 'The size you sell most often',
      sizeSource: 'Declared by you',
    },
    letterhead: { overline: 'Your letterhead', logo: 'Logo', taxLabel: 'GSTIN', bank: 'Bank' },
    loading: null,
    unread: null,
    act: {
      ...ACT_AT_REST,
      primary: 'Save and continue',
      primarySpoken: 'Save your company profile and continue setting up HelioGrid',
    },
  },
  hi: {
    title: 'आपकी कंपनी प्रोफ़ाइल',
    lede: 'हर प्रस्ताव, बिल और ग्राहक लिंक पर · एक बार पूछा जाता है',
    parts: [
      { key: 'identity', title: 'लोगो और कंपनी का नाम', standing: 'केवल नाम', mark: 'open' },
      { key: 'address', title: 'पता', standing: 'केवल Pune', mark: 'open' },
      { key: 'tax', title: 'कर पंजीकरण', standing: 'नहीं जोड़ा गया', mark: 'open' },
      { key: 'bank', title: 'बैंक विवरण', standing: 'नहीं जोड़ा गया', mark: 'open' },
      { key: 'declarations', title: 'आप क्या बेचते हैं', standing: 'उत्तर दिया गया', mark: 'met' },
    ],
    identity: { companyName: 'कंपनी का नाम', fromSignup: 'आपके साइनअप से' },
    address: {
      street: 'सड़क का पता',
      streetExample: 'इमारत, गली, इलाक़ा',
      city: 'शहर',
      fromSignup: 'आपके साइनअप से',
      postalCode: 'पिन कोड',
      postalCodeExample: '411038',
      purpose: 'हर दस्तावेज़ पर ग्राहकों को दिखता है',
    },
    tax: {
      label: 'GSTIN (वैकल्पिक)',
      format: '15 characters · like 27ABCDE1234F1Z5',
      error: null,
      checked: 'हम प्रारूप को आपके बाज़ार के नियमों से जाँचते हैं — जारी करने वाले प्राधिकरण से कभी नहीं।',
    },
    bank: {
      bankName: 'बैंक का नाम',
      bankNameExample: 'HDFC Bank',
      accountHolder: 'खाताधारक',
      accountNumber: 'खाता संख्या',
      accountNumberExample: 'आपका चालू खाता',
      routing: 'IFSC',
      routingExample: 'HDFC0001234',
      checked: 'हम प्रारूप को आपके बाज़ार के नियमों से जाँचते हैं — जारी करने वाले प्राधिकरण से कभी नहीं।',
      purpose: 'आपके बिलों पर · आपके पैसे के लेन-देन के लिए कभी नहीं',
    },
    declarations: {
      group: 'आप ज़्यादातर क्या बेचते हैं',
      options: [
        { value: 'residential', title: 'आवासीय', description: 'घर और हाउसिंग सोसाइटी' },
        {
          value: 'ci',
          title: 'वाणिज्यिक और औद्योगिक (C&I)',
          description: 'कारख़ाने, दफ़्तर, गोदाम',
        },
        { value: 'both', title: 'दोनों', description: 'आप दोनों को बेचते हैं' },
      ],
      sizeLabel: 'सामान्य सिस्टम आकार',
      unit: 'kWp',
      sizeHint: 'जो आकार आप सबसे ज़्यादा बेचते हैं',
      sizeSource: 'आपके द्वारा बताया गया',
    },
    letterhead: { overline: 'आपका लेटरहेड', logo: 'लोगो', taxLabel: 'GSTIN', bank: 'बैंक' },
    loading: null,
    unread: null,
    act: {
      ...ACT_AT_REST,
      primary: 'सहेजें और आगे बढ़ें',
      primarySpoken: 'अपनी कंपनी प्रोफ़ाइल सहेजें और आगे बढ़ें',
    },
  },
  mr: {
    title: 'तुमची कंपनी प्रोफाइल',
    lede: 'प्रत्येक प्रस्ताव, बिल आणि ग्राहक लिंकवर · एकदाच विचारले जाते',
    parts: [
      { key: 'identity', title: 'लोगो आणि कंपनीचे नाव', standing: 'फक्त नाव', mark: 'open' },
      { key: 'address', title: 'पत्ता', standing: 'फक्त Pune', mark: 'open' },
      { key: 'tax', title: 'कर नोंदणी', standing: 'जोडलेले नाही', mark: 'open' },
      { key: 'bank', title: 'बँक तपशील', standing: 'जोडलेले नाही', mark: 'open' },
      { key: 'declarations', title: 'तुम्ही काय विकता', standing: 'उत्तर दिले', mark: 'met' },
    ],
    identity: { companyName: 'कंपनीचे नाव', fromSignup: 'तुमच्या साइनअपमधून' },
    address: {
      street: 'रस्त्याचा पत्ता',
      streetExample: 'इमारत, रस्ता, परिसर',
      city: 'शहर',
      fromSignup: 'तुमच्या साइनअपमधून',
      postalCode: 'पिन कोड',
      postalCodeExample: '411038',
      purpose: 'प्रत्येक दस्तऐवजावर ग्राहकांना दिसतो',
    },
    tax: {
      label: 'GSTIN (ऐच्छिक)',
      format: '15 characters · like 27ABCDE1234F1Z5',
      error: null,
      checked: 'आम्ही स्वरूप तुमच्या बाजाराच्या नियमांनुसार तपासतो — जारी करणाऱ्या प्राधिकरणाकडून कधीच नाही.',
    },
    bank: {
      bankName: 'बँकेचे नाव',
      bankNameExample: 'HDFC Bank',
      accountHolder: 'खातेधारक',
      accountNumber: 'खाते क्रमांक',
      accountNumberExample: 'तुमचे चालू खाते',
      routing: 'IFSC',
      routingExample: 'HDFC0001234',
      checked: 'आम्ही स्वरूप तुमच्या बाजाराच्या नियमांनुसार तपासतो — जारी करणाऱ्या प्राधिकरणाकडून कधीच नाही.',
      purpose: 'तुमच्या बिलांवर · तुमच्या पैशांच्या व्यवहारासाठी कधीच नाही',
    },
    declarations: {
      group: 'तुम्ही मुख्यतः काय विकता',
      options: [
        { value: 'residential', title: 'निवासी', description: 'घरे आणि गृहनिर्माण संस्था' },
        {
          value: 'ci',
          title: 'व्यावसायिक व औद्योगिक (C&I)',
          description: 'कारखाने, कार्यालये, गोदामे',
        },
        { value: 'both', title: 'दोन्ही', description: 'तुम्ही दोघांनाही विकता' },
      ],
      sizeLabel: 'सामान्य सिस्टम आकार',
      unit: 'kWp',
      sizeHint: 'तुम्ही सर्वाधिक विकता तो आकार',
      sizeSource: 'तुम्ही सांगितलेले',
    },
    letterhead: { overline: 'तुमचे लेटरहेड', logo: 'लोगो', taxLabel: 'GSTIN', bank: 'बँक' },
    loading: null,
    unread: null,
    act: {
      ...ACT_AT_REST,
      primary: 'जतन करा आणि पुढे जा',
      primarySpoken: 'तुमची कंपनी प्रोफाइल जतन करा आणि पुढे जा',
    },
  },
} as const;

describe('companyProfileWords', () => {
  it.each(['en', 'hi', 'mr'] as const)(
    'in %s a new company’s profile reads whole',
    async (reader) => {
      const { t } = await createTranslator(reader);
      expect(companyProfileWords(t, AT_SIGNUP)).toEqual(WORDS[reader]);
    },
  );
});
