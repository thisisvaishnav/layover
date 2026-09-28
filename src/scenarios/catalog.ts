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
    code: "ja",
    country: "Japan",
    language: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    tagline: "Tokyo & Kyoto",
  },
];

export const DEFAULT_STARTING_PLACE = "cafe";
