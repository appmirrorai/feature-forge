import type { CSSProperties } from 'react';

export const IOS = {
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  black: '#000000',
  white: '#FFFFFF',
  separator: '#C6C6C8',
  groupedBg: '#F2F2F7',
  cardBg: '#FFFFFF',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
} as const;

export const text = {
  largeTitle: { fontSize: '34px', fontWeight: 700, letterSpacing: '-0.4px', fontFamily: IOS.font } as CSSProperties,
  title: { fontSize: '17px', fontWeight: 600, fontFamily: IOS.font } as CSSProperties,
  body: { fontSize: '17px', fontWeight: 400, fontFamily: IOS.font } as CSSProperties,
  caption: { fontSize: '13px', fontWeight: 400, color: IOS.gray, fontFamily: IOS.font } as CSSProperties,
  sectionHeader: { fontSize: '13px', fontWeight: 400, color: IOS.gray, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: IOS.font } as CSSProperties,
};
