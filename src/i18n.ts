import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../locales/en";
import es from "../locales/es";
import el from "../locales/el";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: localStorage.getItem("language") || "en",
        fallbackLng: "en",

        resources: {
            en: { translation: en },
            es: { translation: es },
            el: { translation: el },
        }
    })

    export default i18n;