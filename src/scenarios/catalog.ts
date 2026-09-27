export interface OnboardingCountry {
  code: string;
  country: string;
  language: string;
  nativeName: string;
  flag: string;
  tagline: string;
}

export const ONBOARDING_COUNTRIES: OnboardingCountry[] = [
  {
    code: "es",
    country: "Spain",
    language: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    tagline: "Madrid & Barcelona",
  },
  {
    code: "hi",
    country: "India",
    language: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    tagline: "Delhi & Mumbai",
  },
  {
    code: "ja",
    country: "Japan",
    language: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    tagline: "Tokyo & Kyoto",
  },
  {
    code: "fr",
    country: "France",
    language: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    tagline: "Paris & Lyon",
  },
  {
    code: "it",
    country: "Italy",
    language: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    tagline: "Rome & Florence",
  },
];

export const DEFAULT_STARTING_PLACE = "cafe";
