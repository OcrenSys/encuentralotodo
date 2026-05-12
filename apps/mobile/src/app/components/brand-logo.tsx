import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type BrandLogoVariant = 'lockup' | 'mark';

export function BrandLogo({
  size = 56,
  subtitle = true,
  variant = 'lockup',
}: {
  size?: number;
  subtitle?: boolean;
  variant?: BrandLogoVariant;
}) {
  const mark = <BrandMark size={size} />;

  if (variant === 'mark') {
    return mark;
  }

  return (
    <View style={styles.lockup}>
      {mark}
      <View style={styles.copy}>
        <Text style={styles.wordmark}>
          Encuentralo<Text style={styles.wordmarkAccent}>Todo</Text>
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle}>Local Discovery Platform</Text>
        ) : null}
      </View>
    </View>
  );
}

function BrandMark({ size }: { size: number }) {
  return (
    <Svg height={size} viewBox="0 0 120 120" width={size}>
      <Defs>
        <LinearGradient
          id="brandGradientOuter"
          x1="10"
          x2="106"
          y1="108"
          y2="18"
        >
          <Stop offset="0" stopColor="#0b3555" />
          <Stop offset="0.58" stopColor="#1f7f93" />
          <Stop offset="1" stopColor="#38beb3" />
        </LinearGradient>
        <LinearGradient id="brandGradientInner" x1="30" x2="86" y1="72" y2="26">
          <Stop offset="0" stopColor="#195d78" />
          <Stop offset="1" stopColor="#42c4b4" />
        </LinearGradient>
      </Defs>
      <Path
        d="M60 10c24.7 0 44 18 44 42 0 16.8-7.2 28.4-19.7 40.9L67 110.4c-3.8 3.9-10.2 3.9-14 0L35.7 92.9C23.2 80.4 16 68.8 16 52c0-24 19.3-42 44-42Z"
        fill="url(#brandGradientOuter)"
      />
      <Path
        d="M50.6 68.8 34.8 53.7a6.4 6.4 0 0 1-.2-9 6.4 6.4 0 0 1 9-.2L54 54.4l22.6-25.3a6.4 6.4 0 1 1 9.5 8.6L58.8 68.5a6.4 6.4 0 0 1-8.2.3Z"
        fill="url(#brandGradientInner)"
      />
      <Path
        d="M79.4 32.4 95 16.8a6.6 6.6 0 0 1 9.3 0 6.6 6.6 0 0 1 0 9.4L88.7 41.8a6.6 6.6 0 0 1-9.3 0 6.6 6.6 0 0 1 0-9.4Z"
        fill="url(#brandGradientInner)"
      />
      <Circle cx="107" cy="15" fill="#ff8d62" r="7.3" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  lockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  copy: {
    gap: 2,
  },
  wordmark: {
    color: '#13273B',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  wordmarkAccent: {
    color: '#2db5a8',
  },
  subtitle: {
    color: '#5C7084',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
