import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * UI-chrome i18n (MainWebsite.md pending item 2): shared en/hi/es dictionaries
 * for tabs / settings / auth chrome. The Language screen only offers languages
 * that actually translate something (user decision 2026-07-19).
 *
 * Mirrors HealingSathiWebApp/src/lib/i18n.tsx (same keys, same storage name)
 * so the two clients translate in lockstep.
 */

export const LANGUAGE_STORAGE_KEY = "healingsathi:language";

const en = {
  // Tabs
  home: "Home",
  groups: "Groups",
  chats: "Chats",
  help: "Help",
  profile: "Profile",
  // Settings
  settings: "Settings",
  sectionAccount: "ACCOUNT",
  sectionAdmin: "ADMIN",
  sectionAppearance: "APPEARANCE",
  sectionNotifications: "NOTIFICATIONS",
  editProfile: "Edit profile",
  editProfileHint: "Name, avatar color, conditions",
  changeEmail: "Change email",
  changePassword: "Change password",
  changePasswordHint: "Update your account password",
  blockedUsers: "Blocked users",
  blockedUsersHint: "Manage who can't reach you",
  language: "Language",
  languageHint: "App language",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  chatMessages: "Chat messages",
  chatMessagesHint: "Popups & alerts when someone messages you",
  signOut: "Sign Out",
  deleteMyAccount: "Delete my account",
  // Language screen
  languageScreenHint: "Your choice is saved on this device. Translated content is rolling out gradually.",
  // Auth
  welcomeBack: "Welcome back",
  email: "Email",
  password: "Password",
  forgotPassword: "Forgot password?",
  signIn: "Sign In",
  createAccount: "Create an account",
  tryDemo: "Try the demo",
} as const;

export type StringKey = keyof typeof en;

const hi: Record<StringKey, string> = {
  home: "होम",
  groups: "समूह",
  chats: "चैट्स",
  help: "सहायता",
  profile: "प्रोफ़ाइल",
  settings: "सेटिंग्स",
  sectionAccount: "खाता",
  sectionAdmin: "एडमिन",
  sectionAppearance: "रूप-रंग",
  sectionNotifications: "सूचनाएँ",
  editProfile: "प्रोफ़ाइल संपादित करें",
  editProfileHint: "नाम, अवतार रंग, स्थितियाँ",
  changeEmail: "ईमेल बदलें",
  changePassword: "पासवर्ड बदलें",
  changePasswordHint: "अपना खाता पासवर्ड अपडेट करें",
  blockedUsers: "ब्लॉक किए गए उपयोगकर्ता",
  blockedUsersHint: "तय करें कि कौन आप तक नहीं पहुँच सकता",
  language: "भाषा",
  languageHint: "ऐप की भाषा",
  themeSystem: "सिस्टम",
  themeLight: "लाइट",
  themeDark: "डार्क",
  chatMessages: "चैट संदेश",
  chatMessagesHint: "जब कोई आपको संदेश भेजे तो पॉपअप और अलर्ट",
  signOut: "साइन आउट",
  deleteMyAccount: "मेरा खाता हटाएँ",
  languageScreenHint: "आपकी पसंद इसी डिवाइस पर सहेजी जाती है। अनुवादित सामग्री धीरे-धीरे आ रही है।",
  welcomeBack: "वापसी पर स्वागत है",
  email: "ईमेल",
  password: "पासवर्ड",
  forgotPassword: "पासवर्ड भूल गए?",
  signIn: "साइन इन करें",
  createAccount: "खाता बनाएँ",
  tryDemo: "डेमो आज़माएँ",
};

const es: Record<StringKey, string> = {
  home: "Inicio",
  groups: "Grupos",
  chats: "Chats",
  help: "Ayuda",
  profile: "Perfil",
  settings: "Ajustes",
  sectionAccount: "CUENTA",
  sectionAdmin: "ADMIN",
  sectionAppearance: "APARIENCIA",
  sectionNotifications: "NOTIFICACIONES",
  editProfile: "Editar perfil",
  editProfileHint: "Nombre, color de avatar, condiciones",
  changeEmail: "Cambiar correo",
  changePassword: "Cambiar contraseña",
  changePasswordHint: "Actualiza la contraseña de tu cuenta",
  blockedUsers: "Usuarios bloqueados",
  blockedUsersHint: "Gestiona quién no puede contactarte",
  language: "Idioma",
  languageHint: "Idioma de la app",
  themeSystem: "Sistema",
  themeLight: "Claro",
  themeDark: "Oscuro",
  chatMessages: "Mensajes de chat",
  chatMessagesHint: "Avisos y alertas cuando alguien te escribe",
  signOut: "Cerrar sesión",
  deleteMyAccount: "Eliminar mi cuenta",
  languageScreenHint: "Tu elección se guarda en este dispositivo. El contenido traducido llega poco a poco.",
  welcomeBack: "Bienvenido de nuevo",
  email: "Correo electrónico",
  password: "Contraseña",
  forgotPassword: "¿Olvidaste tu contraseña?",
  signIn: "Iniciar sesión",
  createAccount: "Crear una cuenta",
  tryDemo: "Prueba la demo",
};

const DICTS: Record<string, Record<StringKey, string>> = { en, hi, es };

type LanguageContextValue = {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: StringKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("en");

  // Boot from the persisted choice (the Language screen has always written this key).
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
      if (stored) setLanguageState(stored);
    });
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = DICTS[language] ?? en;
    return {
      language,
      setLanguage: (code: string) => {
        setLanguageState(code);
        AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      },
      t: (key) => dict[key] ?? en[key],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
/** `const t = useT()` → `t("home")`. Re-renders live when the language changes. */
export const useT = () => useContext(LanguageContext).t;
