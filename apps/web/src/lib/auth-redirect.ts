const APP_ORIGIN = 'https://creator-os.invalid';

export function getPostAuthDestination(returnTo: string | null | undefined): string {
  if (!returnTo?.startsWith('/') || returnTo.startsWith('//')) return '/dashboard';

  try {
    const destination = new URL(returnTo, APP_ORIGIN);
    if (destination.origin !== APP_ORIGIN || ['/login', '/auth/callback'].includes(destination.pathname)) {
      return '/dashboard';
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/dashboard';
  }
}
