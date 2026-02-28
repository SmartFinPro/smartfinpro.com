'use client';

import { useEffect } from 'react';

const DEV_BUILD_MARKER =
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  'local-dev';

const STORAGE_KEY = 'sfp_dev_build_marker';

export function DevCacheBuster() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const currentMarker = String(DEV_BUILD_MARKER);
    const lastMarker = localStorage.getItem(STORAGE_KEY);
    // Definitive loop-safe behavior: never auto-redirect in dev.
    // We only update marker + emit a console hint when the bundle marker changed.
    if (lastMarker && lastMarker !== currentMarker) {
      console.info(
        '[DevCacheBuster] Build marker changed. If UI looks stale, run a hard reload (Cmd/Ctrl+Shift+R).',
      );
    }
    localStorage.setItem(STORAGE_KEY, currentMarker);
  }, []);

  return null;
}
