import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export interface IconSymbolProps extends SymbolViewProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconSymbol({ size = 24, style, ...rest }: IconSymbolProps) {
  return (
    <SymbolView
      weight="medium"
      scale="medium"
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      {...rest}
    />
  );
}
