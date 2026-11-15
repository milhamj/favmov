import { COLORS } from '@/theme/colors';
import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Platform,
  TextLayoutEventData,
  NativeSyntheticEvent,
} from 'react-native';

interface ExpandableTextProps {
  text: string;
  viewStyle?: object;
  textStyle?: object;
  maxLines?: number;
}

const ExpandableText = ({ text, viewStyle, textStyle, maxLines = 2 }: ExpandableTextProps) => {
  const [isTruncated, setIsTruncated] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const textRef = useRef<Text>(null);

  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (Platform.OS !== 'web') {
      setIsTruncated(e.nativeEvent.lines.length > maxLines);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && textRef.current) {
      // @ts-ignore - scrollHeight and clientHeight exist on web but not in RN types
      const element = textRef.current as unknown as HTMLElement;
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [text, maxLines]);

  const numberOfLines = isExpanded ? undefined : isTruncated ? maxLines - 1 : maxLines;

  return (
    <View style={[styles.container, viewStyle]}>
      <Text
        ref={textRef}
        numberOfLines={numberOfLines}
        onTextLayout={handleTextLayout}
        style={textStyle}
      >
        {text}
      </Text>
      {isTruncated && !isExpanded && (
        <Pressable
          accessibilityRole="button"
          aria-expanded={false}
          accessibilityState={{ expanded: false }}
          onPress={() => setIsExpanded(true)}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.seeMoreText}>See More</Text>
        </Pressable>
      )}
      {isTruncated && isExpanded && (
        <Pressable
          accessibilityRole="button"
          aria-expanded={true}
          accessibilityState={{ expanded: true }}
          onPress={() => setIsExpanded(false)}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.seeMoreText}>See Less</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  action: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  seeMoreText: {
    color: COLORS.accentText,
  },
});

export default ExpandableText;
