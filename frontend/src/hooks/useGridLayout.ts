import { useState } from 'react';
import { SPACING } from '../styles/colors';

export function useGridLayout() {
  const [width, setWidth] = useState(0);
  return {
    itemWidth: Math.max(0, (width - SPACING.medium) / 2),
    // Inner content excludes the space taken by classic web scrollbars.
    onContentSizeChange: (contentWidth: number) => setWidth(contentWidth),
  };
}
