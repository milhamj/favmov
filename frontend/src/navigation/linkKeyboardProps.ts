import { Platform } from 'react-native';
import type { KeyboardEvent } from 'react';

// RN Web skips Enter activation for link roles even when there is no native anchor.
export const linkKeyboardProps =
  Platform.OS === 'web'
    ? {
        onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' && !event.repeat) {
            event.preventDefault();
            event.currentTarget.click();
          }
        },
      }
    : {};
