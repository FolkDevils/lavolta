"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_FONT_SANS, DEFAULT_FONT_SERIF } from "@/lib/cardFonts";

export type CardFontContextValue = {
  serif: string;
  sans: string;
};

const CardFontContext = createContext<CardFontContextValue | null>(null);

export function CardFontProvider({
  serif,
  sans,
  children,
}: {
  serif: string;
  sans: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ serif, sans }), [serif, sans]);
  return <CardFontContext.Provider value={value}>{children}</CardFontContext.Provider>;
}

export function useCardFonts(): CardFontContextValue {
  const v = useContext(CardFontContext);
  return v ?? { serif: DEFAULT_FONT_SERIF, sans: DEFAULT_FONT_SANS };
}
