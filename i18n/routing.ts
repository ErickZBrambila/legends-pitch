export const locales = ["en", "es"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "es";
}
