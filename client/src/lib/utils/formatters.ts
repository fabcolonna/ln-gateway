export function formatMaybeNumber(value: number | null | undefined) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat().format(value);
}

export function formatMaybePercent(value: number | null | undefined) {
  if (value === undefined || value === null) return "—";
  return `${(value * 100).toFixed(0)}%`;
}

export function splitForMiddleEllipsis(text: string, tailChars = 16) {
  if (tailChars <= 0) return { head: text, tail: "" };

  // If it is already short, keep it as-is.
  if (text.length <= tailChars * 2 + 3) return { head: text, tail: "" };

  return {
    head: text.slice(0, Math.max(0, text.length - tailChars)),
    tail: text.slice(Math.max(0, text.length - tailChars)),
  };
}

export function formatMsat(msat: number | undefined) {
  if (msat === undefined) return "—";
  const nfMsat = new Intl.NumberFormat();
  const nfSat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
  return `${nfMsat.format(msat)} msat (${nfSat.format(msat / 1000)} sat)`;
}
