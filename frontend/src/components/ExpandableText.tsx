import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, TextLayoutEventData, NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';

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
      // For web, compare scrollHeight with clientHeight
      // @ts-ignore - scrollHeight and clientHeight exist on web but not in RN types
      const element = textRef.current as unknown as HTMLElement;
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [text, maxLines]);

  // If expanded, show all lines; if truncated, show maxLines - 1 to accommodate "See More"
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
      { isTruncated && !isExpanded && (
        <Text onPress={() => setIsExpanded(true)} style={styles.seeMoreText}>
          {'See More'}
        </Text>
      )}
      { isTruncated && isExpanded && (
        <Text onPress={() => setIsExpanded(false)} style={styles.seeMoreText}>
          {'See Less'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  seeMoreText: {
    color: 'tomato',
  }
});

export default ExpandableText;