import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Platform, TextLayoutEventData, NativeSyntheticEvent } from 'react-native';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
}

const ExpandableText = ({ text, maxLines = 3 }: ExpandableTextProps) => {
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

  return (
    <View style={styles.container}>
      <Text
        ref={textRef}
        numberOfLines={isExpanded ? undefined : maxLines}
        onTextLayout={handleTextLayout}
        style={styles.text}
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
  text: {
    fontSize: 14,
    textAlign: 'left',
    fontWeight: '300',
    color: '#444',
  },
  seeMoreText: {
    color: 'tomato',
  }
});

export default ExpandableText;