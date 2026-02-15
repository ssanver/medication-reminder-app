export const fontScaleLevels = [1, 1.15, 1.3] as const;

export function isFontScaleLevelValid(value: number): boolean {
  return fontScaleLevels.includes(value as (typeof fontScaleLevels)[number]);
}

export function contrastRatio(lightLuminance: number, darkLuminance: number): number {
  const light = Math.max(lightLuminance, darkLuminance);
  const dark = Math.min(lightLuminance, darkLuminance);
  return (light + 0.05) / (dark + 0.05);
}

export function isContrastCompliant(ratio: number, isLargeText: boolean): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
