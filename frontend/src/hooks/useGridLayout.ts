import { useState } from 'react';
import { SPACING } from '@/theme/colors';

export function calculateGridLayout(width: number, minItemWidth: number) {
  const gap = SPACING.medium;
  const numColumns = Math.max(2, Math.floor((width + gap) / (minItemWidth + gap)));
  return { numColumns, itemWidth: Math.max(0, (width - gap * (numColumns - 1)) / numColumns) };
}

export function useGridLayout(minItemWidth: number) {
  const [width, setWidth] = useState(0);
  return {
    ...calculateGridLayout(width, minItemWidth),
    // Inner content excludes the space taken by classic web scrollbars.
    onContentSizeChange: (contentWidth: number) => setWidth(contentWidth),
  };
}
