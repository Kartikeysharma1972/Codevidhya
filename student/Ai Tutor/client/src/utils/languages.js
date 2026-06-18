// Languages the AI Tutor can respond in. `value` is the English name stored on
// the user and sent to the backend; `native` is shown in the UI so students can
// recognise their language. Keep in sync with SUPPORTED_LANGUAGES in
// server/routes/auth.js and LANGUAGE_NATIVE in server/utils/gradePrompts.js.
export const LANGUAGES = [
  { value: 'English',   label: 'English' },
  { value: 'Hindi',     label: 'हिन्दी (Hindi)' },
  { value: 'Bengali',   label: 'বাংলা (Bengali)' },
  { value: 'Telugu',    label: 'తెలుగు (Telugu)' },
  { value: 'Marathi',   label: 'मराठी (Marathi)' },
  { value: 'Tamil',     label: 'தமிழ் (Tamil)' },
  { value: 'Gujarati',  label: 'ગુજરાતી (Gujarati)' },
  { value: 'Kannada',   label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'Punjabi',   label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'Odia',      label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'Urdu',      label: 'اردو (Urdu)' },
  { value: 'Assamese',  label: 'অসমীয়া (Assamese)' },
];

export const labelFor = (value) =>
  LANGUAGES.find(l => l.value === value)?.label || 'English';
