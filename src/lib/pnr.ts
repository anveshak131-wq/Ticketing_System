export function generatePNR(): string {
  let pnr = "";
  for (let i = 0; i < 10; i++) {
    pnr += Math.floor(Math.random() * 10).toString();
  }
  return pnr;
}

export function isValidPNR(pnr: string): boolean {
  return /^\d{10}$/.test(pnr.trim());
}

export function formatPNR(pnr: string): string {
  const clean = pnr.replace(/\D/g, "");
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 10)}`;
}
