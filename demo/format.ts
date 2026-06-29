/** Tiny console helpers for the clearinghouse demo. */

export function section(title: string): void {
  console.log("");
  console.log("═".repeat(72));
  console.log(`  ${title}`);
  console.log("═".repeat(72));
}

export function kv(key: string, value: string | number | boolean): void {
  console.log(`  ${key.padEnd(22)} ${value}`);
}

export function table(
  headers: string[],
  rows: (string | number)[][],
): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)),
  );
  const line = widths.map((w) => "-".repeat(w)).join("  ");
  console.log(
    "  " + headers.map((h, i) => h.padEnd(widths[i]!)).join("  "),
  );
  console.log("  " + line);
  for (const row of rows) {
    console.log(
      "  " +
        row.map((cell, i) => String(cell).padEnd(widths[i]!)).join("  "),
    );
  }
}

export function fmtUsdc(n: number): string {
  return `$${n.toFixed(4)}`;
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
