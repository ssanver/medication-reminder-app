import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { theme } from '../../theme';

export type AppIconName = 'home' | 'pill' | 'add' | 'settings' | 'back' | 'forward' | 'close' | 'check' | 'alarm';

type AppIconProps = {
  name: AppIconName;
  color?: string;
  size?: number;
};

export function AppIcon({ name, color = theme.colors.semantic.textSecondary, size = 14 }: AppIconProps) {
  return (
    <View style={styles.icon}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {name === 'home' ? (
          <>
            <Path d="M3.5 10.5L12 3.8L20.5 10.5V19.2C20.5 20 19.8 20.7 19 20.7H14.5V14.8H9.5V20.7H5C4.2 20.7 3.5 20 3.5 19.2V10.5Z" stroke={color} strokeWidth={1.8} />
          </>
        ) : null}
        {name === 'pill' ? (
          <>
            <Path d="M8.2 5.6C10.6 3.2 14.6 3.2 17 5.6C19.4 8 19.4 12 17 14.4L14.4 17C12 19.4 8 19.4 5.6 17C3.2 14.6 3.2 10.6 5.6 8.2L8.2 5.6Z" stroke={color} strokeWidth={1.8} />
            <Line x1="7.7" y1="16.3" x2="16.3" y2="7.7" stroke={color} strokeWidth={1.8} />
          </>
        ) : null}
        {name === 'add' ? (
          <>
            <Rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.2" stroke={color} strokeWidth={1.8} />
            <Line x1="12" y1="7.5" x2="12" y2="16.5" stroke={color} strokeWidth={1.8} />
            <Line x1="7.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth={1.8} />
          </>
        ) : null}
        {name === 'settings' ? (
          <>
            <Circle cx="12" cy="12" r="3.1" stroke={color} strokeWidth={1.8} />
            <Path d="M12 2.8V5.1M12 18.9V21.2M21.2 12H18.9M5.1 12H2.8M18.5 5.5L16.9 7.1M7.1 16.9L5.5 18.5M18.5 18.5L16.9 16.9M7.1 7.1L5.5 5.5" stroke={color} strokeWidth={1.8} />
          </>
        ) : null}
        {name === 'back' ? <Path d="M14.5 6L8.5 12L14.5 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {name === 'forward' ? <Path d="M9.5 6L15.5 12L9.5 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {name === 'close' ? (
          <>
            <Line x1="6.5" y1="6.5" x2="17.5" y2="17.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Line x1="17.5" y1="6.5" x2="6.5" y2="17.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
          </>
        ) : null}
        {name === 'check' ? <Path d="M5.8 12.4L10 16.5L18.2 8.3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {name === 'alarm' ? (
          <>
            <Path d="M12 4.3C8.7 4.3 6 7 6 10.3V13.6L4.7 16.1H19.3L18 13.6V10.3C18 7 15.3 4.3 12 4.3Z" stroke={color} strokeWidth={1.8} />
            <Path d="M10.1 18.1C10.4 19.2 11.1 19.7 12 19.7C12.9 19.7 13.6 19.2 13.9 18.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
