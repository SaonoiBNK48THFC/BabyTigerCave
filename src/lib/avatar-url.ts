const AVATAR_DIRECTORY = '/images/supporters/';
const DRIVE_THUMBNAIL = 'https://drive.google.com/thumbnail';
const DRIVE_FILE_ID = /^[A-Za-z0-9_-]+$/;
const driveAvatarUrl = (id: string, resourceKey?: string) =>
  `${DRIVE_THUMBNAIL}?id=${encodeURIComponent(id)}&sz=w400${resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : ''}`;

// Prefer Drive File IDs; retain local filenames during migration. Accept our
// generated URLs too because parser output passes through both avatar renderers.
export function normalizeAvatarUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    if (DRIVE_FILE_ID.test(trimmed)) return driveAvatarUrl(trimmed);
    if (trimmed.startsWith('https://drive.google.com/')) {
      const url = new URL(trimmed);
      const filePath = url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/view|\/preview)?\/?$/);
      const queryPath = ['/thumbnail', '/open', '/uc'].includes(url.pathname);
      const id = filePath?.[1] ?? (queryPath ? url.searchParams.get('id') ?? '' : '');
      const resourceKey = url.searchParams.get('resourcekey') || undefined;
      if (url.origin !== 'https://drive.google.com'
        || url.username || url.password || !DRIVE_FILE_ID.test(id)) return undefined;
      if (resourceKey && !DRIVE_FILE_ID.test(resourceKey)) return undefined;
      return driveAvatarUrl(id, resourceKey);
    }
    const filename = trimmed.startsWith(AVATAR_DIRECTORY)
      ? decodeURIComponent(trimmed.slice(AVATAR_DIRECTORY.length))
      : trimmed;
    if (/[\/\\\u0000-\u001f\u007f]/.test(filename)
      || !/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(filename)) return undefined;
    return `${AVATAR_DIRECTORY}${encodeURIComponent(filename)}`;
  } catch {
    return undefined;
  }
}
