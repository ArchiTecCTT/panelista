// File type from magic bytes. The client's Content-Type header is not trusted.
export type Sniffed = { type: string; ext: string } | null;

export function sniff(b: Uint8Array): Sniffed {
  const at = (i: number, ...bytes: number[]) => bytes.every((x, j) => b[i + j] === x);
  if (at(0, 0xff, 0xd8, 0xff)) return { type: "image/jpeg", ext: "jpg" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { type: "image/png", ext: "png" };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { type: "image/webp", ext: "webp" };
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return { type: "application/pdf", ext: "pdf" };
  return null;
}
