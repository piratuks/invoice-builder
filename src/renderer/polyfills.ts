// @react-pdf/layout's fetchImage calls Buffer.isBuffer(source) unconditionally, but Buffer is a
// Node global that Vite doesn't provide in the renderer. Images here are always strings/Blobs,
// never real Node Buffers, so a minimal stub is enough to stop the ReferenceError.
const windowWithBuffer = window as unknown as { Buffer?: { isBuffer: (value: unknown) => boolean } };

if (typeof window !== 'undefined' && !windowWithBuffer.Buffer) {
  windowWithBuffer.Buffer = { isBuffer: () => false };
}
