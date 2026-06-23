import type { Passenger, Reservation, ReservationStatus } from "@/types";
import { CLASS_LABELS } from "@/types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

const COLORS = {
  page: "#F8FAFC",
  ink: "#0F172A",
  muted: "#64748B",
  border: "#CBD5E1",
  panel: "#FFFFFF",
  navy: "#12213A",
  blue: "#1E3A8A",
  orange: "#EA580C",
  green: "#059669",
  red: "#DC2626",
  amber: "#D97706",
  softBlue: "#EAF2FF",
  softOrange: "#FFF7ED",
  softSlate: "#F1F5F9",
  white: "#FFFFFF",
} as const;

const STATUS_STYLES: Record<ReservationStatus, { label: string; color: string }> = {
  confirmed: { label: "CONFIRMED", color: COLORS.green },
  modified: { label: "MODIFIED", color: COLORS.amber },
  cancelled: { label: "CANCELLED", color: COLORS.red },
  waitlisted: { label: "WAITLISTED", color: COLORS.blue },
};

const BERTH_LABELS: Record<Passenger["berthPreference"], string> = {
  LB: "Lower",
  MB: "Middle",
  UB: "Upper",
  SL: "Side lower",
  SU: "Side upper",
  none: "No preference",
};

const QR_VERSION = 3;
const QR_SIZE = 17 + QR_VERSION * 4;
const QR_DATA_CODEWORDS = 55;
const QR_ECC_CODEWORDS = 15;

type FontKey = "regular" | "bold" | "mono";

interface TextOptions {
  align?: "left" | "center" | "right";
  color?: string;
  font?: FontKey;
  size?: number;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfString(value: string): string {
  return normalizeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function fillColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${pdfNumber(r)} ${pdfNumber(g)} ${pdfNumber(b)} rg`;
}

function strokeColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${pdfNumber(r)} ${pdfNumber(g)} ${pdfNumber(b)} RG`;
}

function topToPdfY(top: number, height = 0): number {
  return PAGE_HEIGHT - top - height;
}

function textWidth(value: string, size: number, font: FontKey): number {
  const average = font === "mono" ? 0.6 : font === "bold" ? 0.58 : 0.54;
  return normalizeText(value).length * size * average;
}

function truncate(value: string, maxLength: number): string {
  const clean = normalizeText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1))}.`;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return normalizeText(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return normalizeText(dateStr);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFare(amount: number): string {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

function formatPdfDate(date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return [
    "D:",
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function drawRect(
  ops: string[],
  x: number,
  top: number,
  width: number,
  height: number,
  options: { fill?: string; stroke?: string; strokeWidth?: number } = {}
) {
  ops.push("q");
  if (options.fill) ops.push(fillColor(options.fill));
  if (options.stroke) {
    ops.push(strokeColor(options.stroke));
    ops.push(`${pdfNumber(options.strokeWidth ?? 1)} w`);
  }
  ops.push(
    `${pdfNumber(x)} ${pdfNumber(topToPdfY(top, height))} ${pdfNumber(width)} ${pdfNumber(height)} re ${
      options.fill && options.stroke ? "B" : options.fill ? "f" : "S"
    }`
  );
  ops.push("Q");
}

function drawLine(
  ops: string[],
  x1: number,
  top1: number,
  x2: number,
  top2: number,
  color: string = COLORS.border,
  width: number = 1
) {
  ops.push("q", strokeColor(color), `${pdfNumber(width)} w`);
  ops.push(
    `${pdfNumber(x1)} ${pdfNumber(PAGE_HEIGHT - top1)} m ${pdfNumber(x2)} ${pdfNumber(
      PAGE_HEIGHT - top2
    )} l S`
  );
  ops.push("Q");
}

function drawText(ops: string[], value: string, x: number, top: number, options: TextOptions = {}) {
  const font = options.font ?? "regular";
  const size = options.size ?? 10;
  const fontName = font === "bold" ? "F2" : font === "mono" ? "F3" : "F1";
  const clean = normalizeText(value);
  const width = textWidth(clean, size, font);
  const textX = options.align === "right" ? x - width : options.align === "center" ? x - width / 2 : x;

  ops.push("BT");
  ops.push(`/${fontName} ${pdfNumber(size)} Tf`);
  ops.push(fillColor(options.color ?? COLORS.ink));
  ops.push(`${pdfNumber(textX)} ${pdfNumber(PAGE_HEIGHT - top)} Td`);
  ops.push(`(${escapePdfString(clean)}) Tj`);
  ops.push("ET");
}

function drawLabelValue(
  ops: string[],
  label: string,
  value: string,
  x: number,
  top: number,
  width: number,
  options: { valueSize?: number; valueColor?: string } = {}
) {
  drawText(ops, label, x, top, {
    color: COLORS.muted,
    font: "bold",
    size: 7.5,
  });
  drawText(ops, truncate(value, Math.floor(width / 5.6)), x, top + 19, {
    color: options.valueColor ?? COLORS.ink,
    font: "bold",
    size: options.valueSize ?? 12,
  });
}

function createBitBuffer() {
  const bits: boolean[] = [];
  return {
    bits,
    push(value: number, length: number) {
      for (let i = length - 1; i >= 0; i -= 1) {
        bits.push(((value >>> i) & 1) === 1);
      }
    },
  };
}

function createQrGaloisTables() {
  const exp = new Array<number>(512).fill(0);
  const log = new Array<number>(256).fill(0);
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = value;
    log[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < exp.length; i += 1) {
    exp[i] = exp[i - 255];
  }
  return { exp, log };
}

const QR_GF = createQrGaloisTables();

function qrGaloisMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return QR_GF.exp[QR_GF.log[a] + QR_GF.log[b]];
}

function createQrGeneratorPolynomial(degree: number): number[] {
  let polynomial = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(polynomial.length + 1).fill(0);
    polynomial.forEach((coefficient, index) => {
      next[index] ^= qrGaloisMultiply(coefficient, 1);
      next[index + 1] ^= qrGaloisMultiply(coefficient, QR_GF.exp[i]);
    });
    polynomial = next;
  }
  return polynomial;
}

function createQrErrorCorrection(data: number[]): number[] {
  const generator = createQrGeneratorPolynomial(QR_ECC_CODEWORDS);
  const result = new Array<number>(QR_ECC_CODEWORDS).fill(0);
  data.forEach((codeword) => {
    const factor = codeword ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < QR_ECC_CODEWORDS; i += 1) {
      result[i] ^= qrGaloisMultiply(generator[i + 1], factor);
    }
  });
  return result;
}

function createQrCodewords(value: string): number[] {
  const payload = Array.from(new TextEncoder().encode(value));
  const buffer = createBitBuffer();
  buffer.push(0b0100, 4);
  buffer.push(payload.length, 8);
  payload.forEach((byte) => buffer.push(byte, 8));

  const capacityBits = QR_DATA_CODEWORDS * 8;
  const terminatorLength = Math.min(4, capacityBits - buffer.bits.length);
  buffer.push(0, terminatorLength);
  while (buffer.bits.length % 8 !== 0) buffer.bits.push(false);

  const data: number[] = [];
  for (let i = 0; i < buffer.bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | (buffer.bits[i + j] ? 1 : 0);
    }
    data.push(byte);
  }

  const padding = [0xec, 0x11];
  let paddingIndex = 0;
  while (data.length < QR_DATA_CODEWORDS) {
    data.push(padding[paddingIndex % padding.length]);
    paddingIndex += 1;
  }

  return [...data, ...createQrErrorCorrection(data)];
}

function createQrMatrix(value: string): boolean[][] {
  const base = Array.from({ length: QR_SIZE }, () => new Array<boolean>(QR_SIZE).fill(false));
  const reserved = Array.from({ length: QR_SIZE }, () => new Array<boolean>(QR_SIZE).fill(false));

  const setModule = (x: number, y: number, dark: boolean, reserve = true) => {
    if (x < 0 || y < 0 || x >= QR_SIZE || y >= QR_SIZE) return;
    base[y][x] = dark;
    if (reserve) reserved[y][x] = true;
  };

  const drawFinder = (left: number, top: number) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const xx = left + x;
        const yy = top + y;
        const dark =
          x >= 0 &&
          x <= 6 &&
          y >= 0 &&
          y <= 6 &&
          (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
        setModule(xx, yy, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(QR_SIZE - 7, 0);
  drawFinder(0, QR_SIZE - 7);

  for (let i = 8; i < QR_SIZE - 8; i += 1) {
    const dark = i % 2 === 0;
    setModule(i, 6, dark);
    setModule(6, i, dark);
  }

  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      setModule(22 + x, 22 + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
  }

  setModule(8, QR_SIZE - 8, true);

  const reserveFormatAreas = () => {
    for (let i = 0; i <= 8; i += 1) {
      if (i !== 6) {
        setModule(8, i, false);
        setModule(i, 8, false);
      }
    }
    for (let i = 0; i < 8; i += 1) {
      setModule(QR_SIZE - 1 - i, 8, false);
    }
    for (let i = 8; i < 15; i += 1) {
      setModule(8, QR_SIZE - 15 + i, false);
    }
  };
  reserveFormatAreas();

  const dataBits = createQrCodewords(value).flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => ((codeword >>> (7 - index)) & 1) === 1)
  );

  const maskFns = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];

  const drawFormatBits = (matrix: boolean[][], mask: number) => {
    const data = (1 << 3) | mask;
    let remainder = data;
    for (let i = 0; i < 10; i += 1) {
      remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) ? 0x537 : 0);
    }
    const bits = ((data << 10) | remainder) ^ 0x5412;
    const bit = (index: number) => ((bits >>> index) & 1) === 1;

    for (let i = 0; i <= 5; i += 1) matrix[i][8] = bit(i);
    matrix[7][8] = bit(6);
    matrix[8][8] = bit(7);
    matrix[8][7] = bit(8);
    for (let i = 9; i < 15; i += 1) matrix[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i += 1) matrix[8][QR_SIZE - 1 - i] = bit(i);
    for (let i = 8; i < 15; i += 1) matrix[QR_SIZE - 15 + i][8] = bit(i);
    matrix[QR_SIZE - 8][8] = true;
  };

  const penalty = (matrix: boolean[][]) => {
    let score = 0;
    const scoreRuns = (line: boolean[]) => {
      let runColor = line[0];
      let runLength = 1;
      for (let i = 1; i < line.length; i += 1) {
        if (line[i] === runColor) {
          runLength += 1;
        } else {
          if (runLength >= 5) score += 3 + runLength - 5;
          runColor = line[i];
          runLength = 1;
        }
      }
      if (runLength >= 5) score += 3 + runLength - 5;
    };

    for (let y = 0; y < QR_SIZE; y += 1) scoreRuns(matrix[y]);
    for (let x = 0; x < QR_SIZE; x += 1) scoreRuns(matrix.map((row) => row[x]));

    for (let y = 0; y < QR_SIZE - 1; y += 1) {
      for (let x = 0; x < QR_SIZE - 1; x += 1) {
        const color = matrix[y][x];
        if (matrix[y][x + 1] === color && matrix[y + 1][x] === color && matrix[y + 1][x + 1] === color) {
          score += 3;
        }
      }
    }

    const pattern = [true, false, true, true, true, false, true, false, false, false, false];
    const reversePattern = [...pattern].reverse();
    const matchesPattern = (line: boolean[], start: number, target: boolean[]) =>
      target.every((value, index) => line[start + index] === value);
    for (let y = 0; y < QR_SIZE; y += 1) {
      for (let x = 0; x <= QR_SIZE - pattern.length; x += 1) {
        if (matchesPattern(matrix[y], x, pattern) || matchesPattern(matrix[y], x, reversePattern)) score += 40;
      }
    }
    for (let x = 0; x < QR_SIZE; x += 1) {
      const column = matrix.map((row) => row[x]);
      for (let y = 0; y <= QR_SIZE - pattern.length; y += 1) {
        if (matchesPattern(column, y, pattern) || matchesPattern(column, y, reversePattern)) score += 40;
      }
    }

    const dark = matrix.flat().filter(Boolean).length;
    score += Math.floor(Math.abs(dark * 20 - QR_SIZE * QR_SIZE * 10) / (QR_SIZE * QR_SIZE)) * 10;
    return score;
  };

  let bestMatrix = base;
  let bestScore = Number.POSITIVE_INFINITY;
  maskFns.forEach((maskFn, mask) => {
    const matrix = base.map((row) => [...row]);
    let bitIndex = 0;
    let upward = true;

    for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;
      for (let vertical = 0; vertical < QR_SIZE; vertical += 1) {
        const y = upward ? QR_SIZE - 1 - vertical : vertical;
        for (let dx = 0; dx < 2; dx += 1) {
          const x = right - dx;
          if (reserved[y][x]) continue;
          const dark = bitIndex < dataBits.length ? dataBits[bitIndex] : false;
          matrix[y][x] = maskFn(x, y) ? !dark : dark;
          bitIndex += 1;
        }
      }
      upward = !upward;
    }

    drawFormatBits(matrix, mask);
    const candidateScore = penalty(matrix);
    if (candidateScore < bestScore) {
      bestScore = candidateScore;
      bestMatrix = matrix;
    }
  });

  return bestMatrix;
}

function drawQrCode(ops: string[], value: string, x: number, top: number, size: number) {
  const modules = createQrMatrix(value);
  const quietZone = 4;
  const moduleSize = size / (QR_SIZE + quietZone * 2);

  drawRect(ops, x, top, size, size, { fill: COLORS.white });
  ops.push("q", fillColor(COLORS.ink));
  modules.forEach((row, moduleY) => {
    row.forEach((dark, moduleX) => {
      if (!dark) return;
      ops.push(
        `${pdfNumber(x + (moduleX + quietZone) * moduleSize)} ${pdfNumber(
          topToPdfY(top + (moduleY + quietZone) * moduleSize, moduleSize)
        )} ${pdfNumber(moduleSize)} ${pdfNumber(moduleSize)} re f`
      );
    });
  });
  ops.push("Q");
}

function createContentStream(reservation: Reservation): string {
  const ops: string[] = [];
  const status = STATUS_STYLES[reservation.status];
  const passengerCount = reservation.passengers.length;
  const primaryPassenger = reservation.passengers[0]?.name ?? "Passenger";
  const channel = reservation.bookingChannel === "agent" ? "Counter booking" : "Online booking";
  const qrPayload = `PNR: ${reservation.pnr}\nSTATUS: ${status.label}`;

  drawRect(ops, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: COLORS.page });
  drawRect(ops, 0, 0, PAGE_WIDTH, 124, { fill: COLORS.navy });
  drawRect(ops, 0, 120, PAGE_WIDTH, 4, { fill: COLORS.orange });

  drawText(ops, "RailConnect", 36, 42, { color: COLORS.white, font: "bold", size: 22 });
  drawText(ops, "Indian Railway Demo e-Ticket", 36, 66, {
    color: "#D7E3F5",
    size: 10,
  });
  drawRect(ops, 418, 28, 126, 30, { fill: status.color });
  drawText(ops, status.label, 481, 48, {
    align: "center",
    color: COLORS.white,
    font: "bold",
    size: 10,
  });
  drawText(ops, "PNR", 418, 82, { color: "#D7E3F5", font: "bold", size: 8 });
  drawText(ops, reservation.pnr, 418, 106, {
    color: COLORS.white,
    font: "mono",
    size: 20,
  });

  drawRect(ops, 32, 148, 531, 224, { fill: COLORS.panel, stroke: COLORS.border });
  drawText(ops, "Journey Summary", 56, 178, { color: COLORS.blue, font: "bold", size: 13 });
  drawText(ops, `Ticket for ${truncate(primaryPassenger, 32)}`, 56, 198, {
    color: COLORS.muted,
    size: 9,
  });

  drawRect(ops, 388, 162, 138, 132, { fill: COLORS.softSlate, stroke: COLORS.border });
  drawQrCode(ops, qrPayload, 421, 174, 72);
  drawText(ops, "SCAN QR FOR PNR & STATUS", 457, 260, {
    align: "center",
    color: COLORS.muted,
    font: "bold",
    size: 6.8,
  });
  drawText(ops, reservation.pnr, 457, 276, {
    align: "center",
    color: COLORS.ink,
    font: "mono",
    size: 9,
  });
  drawText(ops, status.label, 457, 286, {
    align: "center",
    color: status.color,
    font: "bold",
    size: 8,
  });

  drawLabelValue(ops, "FROM", reservation.fromName, 56, 226, 145, { valueSize: 14 });
  drawLabelValue(ops, "TO", reservation.toName, 230, 226, 145, { valueSize: 14 });
  drawLine(ops, 58, 286, 344, 286, COLORS.blue, 2);
  drawRect(ops, 54, 280, 12, 12, { fill: COLORS.blue });
  drawRect(ops, 338, 280, 12, 12, { fill: COLORS.orange });
  drawText(ops, reservation.fromStation, 56, 307, { color: COLORS.muted, font: "bold", size: 9 });
  drawText(ops, reservation.toStation, 330, 307, { color: COLORS.muted, font: "bold", size: 9 });

  const detailTop = 318;
  const detailBoxWidth = 116;
  const details = [
    ["TRAIN", `${reservation.trainName} #${reservation.trainNumber}`],
    ["DATE", formatDisplayDate(reservation.travelDate)],
    ["CLASS", CLASS_LABELS[reservation.travelClass]],
    ["FARE", formatFare(reservation.totalFare)],
  ];

  details.forEach(([label, value], index) => {
    const x = 56 + index * 122;
    drawRect(ops, x, detailTop, detailBoxWidth, 38, {
      fill: index % 2 === 0 ? COLORS.softBlue : COLORS.softOrange,
      stroke: COLORS.border,
    });
    drawText(ops, label, x + 10, detailTop + 14, {
      color: COLORS.muted,
      font: "bold",
      size: 7,
    });
    drawText(ops, truncate(value, 18), x + 10, detailTop + 31, {
      color: COLORS.ink,
      font: "bold",
      size: 9,
    });
  });

  drawRect(ops, 32, 398, 531, 230, { fill: COLORS.panel, stroke: COLORS.border });
  drawText(ops, `Passengers (${passengerCount})`, 56, 428, {
    color: COLORS.blue,
    font: "bold",
    size: 13,
  });

  const tableLeft = 56;
  const tableTop = 446;
  const col = {
    number: tableLeft,
    name: tableLeft + 38,
    age: tableLeft + 250,
    gender: tableLeft + 308,
    berth: tableLeft + 386,
  };

  drawRect(ops, tableLeft, tableTop, 482, 28, { fill: COLORS.softSlate, stroke: COLORS.border });
  drawText(ops, "NO", col.number + 8, tableTop + 18, { color: COLORS.muted, font: "bold", size: 8 });
  drawText(ops, "NAME", col.name, tableTop + 18, { color: COLORS.muted, font: "bold", size: 8 });
  drawText(ops, "AGE", col.age, tableTop + 18, { color: COLORS.muted, font: "bold", size: 8 });
  drawText(ops, "GENDER", col.gender, tableTop + 18, { color: COLORS.muted, font: "bold", size: 8 });
  drawText(ops, "SEAT / BERTH", col.berth, tableTop + 18, {
    color: COLORS.muted,
    font: "bold",
    size: 8,
  });

  reservation.passengers.slice(0, 6).forEach((passenger, index) => {
    const rowTop = tableTop + 28 + index * 30;
    drawRect(ops, tableLeft, rowTop, 482, 30, {
      fill: index % 2 === 0 ? COLORS.white : COLORS.page,
      stroke: COLORS.border,
      strokeWidth: 0.5,
    });
    drawText(ops, String(index + 1), col.number + 10, rowTop + 20, { font: "bold", size: 9 });
    drawText(ops, truncate(passenger.name, 30), col.name, rowTop + 20, { font: "bold", size: 9 });
    drawText(ops, String(passenger.age), col.age, rowTop + 20, { size: 9 });
    drawText(ops, passenger.gender.toUpperCase(), col.gender, rowTop + 20, { size: 9 });
    const seat = reservation.seats?.[index];
    const berthText = seat
      ? `${seat} / ${BERTH_LABELS[passenger.berthPreference]}`
      : BERTH_LABELS[passenger.berthPreference];
    drawText(ops, truncate(berthText, 18), col.berth, rowTop + 20, { size: 9 });
  });

  drawRect(ops, 32, 654, 251, 98, { fill: COLORS.panel, stroke: COLORS.border });
  drawText(ops, "Booking Details", 56, 684, { color: COLORS.blue, font: "bold", size: 12 });
  drawText(ops, channel, 56, 706, { font: "bold", size: 10 });
  drawText(ops, `Booked: ${formatDateTime(reservation.bookedAt)}`, 56, 724, {
    color: COLORS.muted,
    size: 9,
  });
  drawText(ops, `Updated: ${formatDateTime(reservation.updatedAt)}`, 56, 740, {
    color: COLORS.muted,
    size: 9,
  });
  if (reservation.bookedBy) {
    drawText(ops, `Agent: ${truncate(reservation.bookedBy, 28)}`, 56, 756, {
      color: COLORS.muted,
      size: 9,
    });
  }

  drawRect(ops, 304, 654, 259, 98, { fill: COLORS.softOrange, stroke: COLORS.border });
  drawText(ops, "Travel Notes", 328, 684, { color: COLORS.orange, font: "bold", size: 12 });
  drawText(ops, "Carry a valid photo ID with this ticket.", 328, 706, {
    color: COLORS.ink,
    font: "bold",
    size: 9.5,
  });
  drawText(ops, "PNR lookup remains the source of truth for status.", 328, 724, {
    color: COLORS.muted,
    size: 8.7,
  });
  drawText(ops, "This ticket is for the RailConnect demo system.", 328, 740, {
    color: COLORS.muted,
    size: 8.7,
  });

  drawLine(ops, 32, 782, 563, 782, COLORS.border);
  drawText(ops, `Generated ${formatDateTime(new Date().toISOString())}`, 32, 806, {
    color: COLORS.muted,
    size: 8,
  });
  drawText(ops, `RailConnect Ticket ${reservation.pnr}`, 563, 806, {
    align: "right",
    color: COLORS.muted,
    size: 8,
  });

  return ops.join("\n");
}

function buildPdf(objects: string[]): Uint8Array {
  const chunks: string[] = ["%PDF-1.4\n%RailConnect\n"];
  const offsets = [0];
  let size = chunks[0].length;

  objects.forEach((object, index) => {
    offsets.push(size);
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
    chunks.push(chunk);
    size += chunk.length;
  });

  const xrefOffset = size;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 8 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  chunks.push(xref);
  return new TextEncoder().encode(chunks.join(""));
}

export function generateTicketPdf(reservation: Reservation): Uint8Array {
  const content = createContentStream(reservation);
  const contentLength = new TextEncoder().encode(content).length;
  const title = `RailConnect Ticket ${reservation.pnr}`;

  return buildPdf([
    "<< /Type /Catalog /Pages 2 0 R /Lang (en-IN) /ViewerPreferences << /DisplayDocTitle true >> >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`,
    `<< /Title (${escapePdfString(title)}) /Author (RailConnect) /Subject (Railway reservation ticket) /Creator (RailConnect Ticketing) /CreationDate (${formatPdfDate()}) >>`,
  ]);
}
