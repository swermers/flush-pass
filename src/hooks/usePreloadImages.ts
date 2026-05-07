'use client';

import { useEffect } from 'react';

export function usePreloadImages(srcs: readonly string[]) {
  useEffect(() => {
    srcs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [srcs]);
}
