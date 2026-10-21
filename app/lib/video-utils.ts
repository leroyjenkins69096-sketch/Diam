export function originalVideoUrls(previewUrl?: string): string[] {
  if (!previewUrl) return [];
  try {
    const pathname = new URL(previewUrl).pathname;
    const marker = 'preview_images/';
    const idx = pathname.indexOf(marker);
    if (idx === -1) return [];
    const hash = pathname.slice(idx + marker.length).split('.')[0];
    if (!hash) return [];
    const base = `https://cdn.shopify.com/videos/c/o/v/${hash}`;
    return [`${base}.mov`, `${base}.mp4`];
  } catch {
    return [];
  }
}
