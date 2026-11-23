import type { GestureResponderEvent } from 'react-native';
import { Platform } from 'react-native';
import { router } from '@/navigation/router';

export type LinkProps = {
  href: string;
  onPress: (event?: GestureResponderEvent) => void;
  accessibilityDisabled?: boolean;
};

// Spread on a Pressable: RN Web renders <a href>, so the browser offers copy link and open in new tab.
// Use `disabled` rather than Pressable's: it keeps the <a> (a <div> swap drops focus) and blocks the click.
// RN Web Pressable overwrites aria-disabled from its own `disabled`, so announce it via accessibilityDisabled.
export function linkProps(href: string, beforeNavigate?: () => void, disabled = false): LinkProps {
  return {
    href,
    accessibilityDisabled: disabled,
    onPress: (event) => {
      if (Platform.OS === 'web') {
        const click = event as unknown as MouseEvent | undefined;
        // Modified clicks are left to the browser (new tab or window); middle-click never reaches onPress.
        if (click && (click.metaKey || click.ctrlKey || click.shiftKey)) return;
      }
      event?.preventDefault();
      if (disabled) return;
      beforeNavigate?.();
      router.navigate(href);
    },
  };
}
