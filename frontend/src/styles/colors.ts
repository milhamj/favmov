export const COLORS = {
  // The approved white-on-tomato primary treatment remains a known contrast exception.
  accent: '#FF6347',
  accentText: '#B8321C',
  onAccent: '#FFFFFF',
  text: '#333333',
  secondaryText: '#666666',
  page: '#FFFFFF',
  header: '#F8F8F8',
  field: '#F5F5F5',
  border: '#E0E0E0',
  destructive: '#FF6B6B',
  warmSurface: 'rgba(243, 143, 77, 0.1)',
  rating_green: '#2E7D32',
  rating_red: '#C62828',
  rating_yellow: '#8A5700',
  background_gray: '#ECEFF1',
};

export const SPACING = { small: 8, medium: 16, large: 24 };
export const RADIUS = { control: 8, panel: 20 };
export const TYPOGRAPHY = {
  pageTitle: { fontSize: 24, fontWeight: 'bold' as const },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' as const },
  rowTitle: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  action: { fontSize: 16, fontWeight: 'bold' as const },
};

export const ROW_ELEVATION = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};
