"use client";

import { useSyncExternalStore } from "react";

/**
 * UI-chrome i18n (pending item 2 in MainWebsite.md): shared en/hi/es
 * dictionaries for nav / tabs / settings / auth. The picker only offers
 * languages that actually translate something (user decision 2026-07-19 —
 * no roster entries that silently fall back to English).
 *
 * Same storage key as the app's LanguageScreen (`healingsathi:language`), so
 * the choice a user makes anywhere follows the device.
 */

export const LANGUAGE_STORAGE_KEY = "healingsathi:language";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "es", label: "Spanish", native: "Español" },
];

// localStorage as an external store: hydration-safe (server snapshot is "en",
// the client snapshot takes over after mount) and update-safe under the
// react-hooks/set-state-in-effect rule.
const langListeners = new Set<() => void>();
const subscribeLanguage = (cb: () => void) => {
  langListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    langListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const readLanguage = () => window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? "en";

export const setLanguage = (code: string) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  langListeners.forEach((l) => l());
};

export const useLanguage = () => useSyncExternalStore(subscribeLanguage, readLanguage, () => "en");

const en = {
  // Nav / tabs
  home: "Home",
  groups: "Groups",
  chats: "Chats",
  help: "Help",
  profile: "Profile",
  healingDiary: "Healing Diary",
  healthTips: "Health Tips",
  settings: "Settings",
  // Top bar
  searchPlaceholder: "Search people, groups, consultants...",
  notifications: "Notifications",
  viewProfile: "View profile →",
  signOut: "Sign out",
  exitDemo: "Exit demo",
  themeAuto: "Auto",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  // Auth
  welcomeBack: "Welcome back",
  signInSubtitle: "Sign in to your circles, chats and care.",
  email: "Email",
  password: "Password",
  forgotPassword: "Forgot password?",
  signIn: "Sign In",
  signingIn: "Signing in...",
  or: "or",
  emailCodeButton: "Email me a sign-in code",
  tryDemo: "Try the demo",
  newHere: "New here?",
  createAccount: "Create an account",
  createYourAccount: "Create your account",
  signUpSubtitle: "A calm place to share, connect and heal.",
  name: "Name",
  signUp: "Create Account",
  signingUp: "Creating...",
  alreadyHaveAccount: "Already have an account?",
  // Settings
  appearance: "Appearance",
  language: "Language",
  languageHint: "Your choice is saved on this device. Translated content is rolling out gradually.",
  notificationsSection: "Notifications",
  chatMessages: "Chat messages",
  chatMessagesHint: "Popups & alerts when someone messages you (synced with the app)",
  account: "Account",
  changePassword: "Change password",
  changeEmail: "Change email",
  cancel: "Cancel",
  blockedUsers: "Blocked users",
  nobodyBlocked: "Nobody is blocked.",
  unblock: "Unblock",
  admin: "Admin",
  demoAccountHint: "Demo mode — sign in to manage a real account.",
  deleteMyAccount: "Delete my account",
} as const;

export type StringKey = keyof typeof en;

const hi: Record<StringKey, string> = {
  home: "होम",
  groups: "समूह",
  chats: "चैट्स",
  help: "सहायता",
  profile: "प्रोफ़ाइल",
  healingDiary: "हीलिंग डायरी",
  healthTips: "स्वास्थ्य सुझाव",
  settings: "सेटिंग्स",
  searchPlaceholder: "लोग, समूह, सलाहकार खोजें...",
  notifications: "सूचनाएँ",
  viewProfile: "प्रोफ़ाइल देखें →",
  signOut: "साइन आउट",
  exitDemo: "डेमो से बाहर निकलें",
  themeAuto: "ऑटो",
  themeSystem: "सिस्टम",
  themeLight: "लाइट",
  themeDark: "डार्क",
  welcomeBack: "वापसी पर स्वागत है",
  signInSubtitle: "अपने सर्कल, चैट और देखभाल में साइन इन करें।",
  email: "ईमेल",
  password: "पासवर्ड",
  forgotPassword: "पासवर्ड भूल गए?",
  signIn: "साइन इन करें",
  signingIn: "साइन इन हो रहा है...",
  or: "या",
  emailCodeButton: "मुझे साइन-इन कोड ईमेल करें",
  tryDemo: "डेमो आज़माएँ",
  newHere: "नए हैं?",
  createAccount: "खाता बनाएँ",
  createYourAccount: "अपना खाता बनाएँ",
  signUpSubtitle: "साझा करने, जुड़ने और स्वस्थ होने की एक शांत जगह।",
  name: "नाम",
  signUp: "खाता बनाएँ",
  signingUp: "बन रहा है...",
  alreadyHaveAccount: "पहले से खाता है?",
  appearance: "रूप-रंग",
  language: "भाषा",
  languageHint: "आपकी पसंद इसी डिवाइस पर सहेजी जाती है। अनुवादित सामग्री धीरे-धीरे आ रही है।",
  notificationsSection: "सूचनाएँ",
  chatMessages: "चैट संदेश",
  chatMessagesHint: "जब कोई आपको संदेश भेजे तो पॉपअप और अलर्ट (ऐप के साथ सिंक)",
  account: "खाता",
  changePassword: "पासवर्ड बदलें",
  changeEmail: "ईमेल बदलें",
  cancel: "रद्द करें",
  blockedUsers: "ब्लॉक किए गए उपयोगकर्ता",
  nobodyBlocked: "किसी को ब्लॉक नहीं किया गया है।",
  unblock: "अनब्लॉक करें",
  admin: "एडमिन",
  demoAccountHint: "डेमो मोड — असली खाता प्रबंधित करने के लिए साइन इन करें।",
  deleteMyAccount: "मेरा खाता हटाएँ",
};

const es: Record<StringKey, string> = {
  home: "Inicio",
  groups: "Grupos",
  chats: "Chats",
  help: "Ayuda",
  profile: "Perfil",
  healingDiary: "Diario de sanación",
  healthTips: "Consejos de salud",
  settings: "Ajustes",
  searchPlaceholder: "Buscar personas, grupos, consultores...",
  notifications: "Notificaciones",
  viewProfile: "Ver perfil →",
  signOut: "Cerrar sesión",
  exitDemo: "Salir de la demo",
  themeAuto: "Auto",
  themeSystem: "Sistema",
  themeLight: "Claro",
  themeDark: "Oscuro",
  welcomeBack: "Bienvenido de nuevo",
  signInSubtitle: "Inicia sesión en tus círculos, chats y cuidados.",
  email: "Correo electrónico",
  password: "Contraseña",
  forgotPassword: "¿Olvidaste tu contraseña?",
  signIn: "Iniciar sesión",
  signingIn: "Iniciando sesión...",
  or: "o",
  emailCodeButton: "Envíame un código de acceso",
  tryDemo: "Prueba la demo",
  newHere: "¿Nuevo aquí?",
  createAccount: "Crear una cuenta",
  createYourAccount: "Crea tu cuenta",
  signUpSubtitle: "Un lugar tranquilo para compartir, conectar y sanar.",
  name: "Nombre",
  signUp: "Crear cuenta",
  signingUp: "Creando...",
  alreadyHaveAccount: "¿Ya tienes una cuenta?",
  appearance: "Apariencia",
  language: "Idioma",
  languageHint: "Tu elección se guarda en este dispositivo. El contenido traducido llega poco a poco.",
  notificationsSection: "Notificaciones",
  chatMessages: "Mensajes de chat",
  chatMessagesHint: "Avisos y alertas cuando alguien te escribe (sincronizado con la app)",
  account: "Cuenta",
  changePassword: "Cambiar contraseña",
  changeEmail: "Cambiar correo",
  cancel: "Cancelar",
  blockedUsers: "Usuarios bloqueados",
  nobodyBlocked: "No hay nadie bloqueado.",
  unblock: "Desbloquear",
  admin: "Admin",
  demoAccountHint: "Modo demo: inicia sesión para gestionar una cuenta real.",
  deleteMyAccount: "Eliminar mi cuenta",
};

const DICTS: Record<string, Record<StringKey, string>> = { en, hi, es };

/** `const t = useT()` → `t("home")`. Re-renders live when the language changes. */
export const useT = () => {
  const lang = useLanguage();
  const dict = DICTS[lang] ?? en;
  return (key: StringKey) => dict[key] ?? en[key];
};
