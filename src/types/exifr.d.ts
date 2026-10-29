declare module "exifr/dist/lite.esm.mjs" {
  const exifr: { parse(input: string | Blob, options?: Record<string, boolean>): Promise<Record<string, unknown> | undefined> };
  export default exifr;
}
