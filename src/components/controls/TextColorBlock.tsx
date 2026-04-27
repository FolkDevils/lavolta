"use client";

import { FD_SOLID_PALETTE } from "@/lib/constants";
import { resolveCardPalette, resolveSolidHex } from "@/lib/color";
import { ColorSelect, type PaletteOption } from "./ColorSelect";
import { SectionLabel } from "./Primitives";

const SOLID_OPTIONS: PaletteOption[] = FD_SOLID_PALETTE.map((c) => ({
  id: c.id,
  name: c.name,
  swatch: c.hex,
}));

type Props = {
  bgValue: string;
  textFill: string | null;
  subTextFill: string | null;
  onTextFill: (v: string | null) => void;
  onSubTextFill: (v: string | null) => void;
  onResetBoth: () => void;
  /** Front-face only: independent phone + email overrides. */
  phoneFill?: string | null;
  emailFill?: string | null;
  onPhoneFill?: (v: string | null) => void;
  onEmailFill?: (v: string | null) => void;
  onResetContact?: () => void;
};

export function TextColorBlock({
  bgValue,
  textFill,
  subTextFill,
  onTextFill,
  onSubTextFill,
  onResetBoth,
  phoneFill,
  emailFill,
  onPhoneFill,
  onEmailFill,
  onResetContact,
}: Props) {
  const bgPal = resolveCardPalette(bgValue);
  const primaryResolved = resolveSolidHex(textFill, bgPal.text);
  const subResolved = resolveSolidHex(subTextFill, bgPal.text);
  const phoneResolved = resolveSolidHex(phoneFill ?? null, primaryResolved);
  const emailResolved = resolveSolidHex(emailFill ?? null, primaryResolved);

  const hasCustomPrimary = textFill != null || subTextFill != null;
  const hasCustomContact = onPhoneFill != null && (phoneFill != null || emailFill != null);
  const showContact = onPhoneFill != null && onEmailFill != null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <SectionLabel>Primary text</SectionLabel>
        <ColorSelect
          value={textFill}
          onChange={onTextFill}
          options={SOLID_OPTIONS}
          resolvedHex={primaryResolved}
          nullable={{ label: "Auto" }}
        />
      </div>
      <div>
        <SectionLabel>Secondary text</SectionLabel>
        <ColorSelect
          value={subTextFill}
          onChange={onSubTextFill}
          options={SOLID_OPTIONS}
          resolvedHex={subResolved}
          nullable={{ label: "Auto" }}
        />
      </div>
      {hasCustomPrimary && (
        <button
          type="button"
          onClick={onResetBoth}
          className="text-[9px] uppercase tracking-[0.1em] text-left text-[rgba(255,208,0,0.4)] hover:text-[#ffd000]"
        >
          Reset primary + secondary
        </button>
      )}

      {showContact && (
        <>
          <div className="border-t border-[rgba(255,208,0,0.08)] pt-3">
            <SectionLabel>Phone</SectionLabel>
            <ColorSelect
              value={phoneFill ?? null}
              onChange={onPhoneFill!}
              options={SOLID_OPTIONS}
              resolvedHex={phoneResolved}
              nullable={{ label: "Auto" }}
            />
          </div>
          <div>
            <SectionLabel>Email</SectionLabel>
            <ColorSelect
              value={emailFill ?? null}
              onChange={onEmailFill!}
              options={SOLID_OPTIONS}
              resolvedHex={emailResolved}
              nullable={{ label: "Auto" }}
            />
          </div>
          {hasCustomContact && onResetContact && (
            <button
              type="button"
              onClick={onResetContact}
              className="text-[9px] uppercase tracking-[0.1em] text-left text-[rgba(255,208,0,0.4)] hover:text-[#ffd000]"
            >
              Reset phone + email to primary
            </button>
          )}
        </>
      )}
    </div>
  );
}
