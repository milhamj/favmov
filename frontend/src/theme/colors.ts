export const COLORS = {
  // White on accent is below WCAG AA contrast for small text; use accentText on light backgrounds.
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
  ratingGood: '#2E7D32',
  ratingBad: '#C62828',
  ratingAverage: '#D49A00',
  posterPlaceholder: '#ECEFF1',
  shadow: '#000000',
  imageBackdrop: '#000000',
  chipText: '#000000',
  mutedIcon: '#808080',
  validationError: '#FF0000',
  genreSurface: '#EEEEEE',
  scrim: 'rgba(0, 0, 0, 0.5)',
  sheetDivider: '#F0F0F0',
  errorSurface: '#FFF0EC',
  collectionCount: '#222222',
  avatar: '#6C5CE7',
  collectionRose: '#F2C8C8',
  collectionGreen: '#C8E6C9',
  collectionBlue: '#CCD9F2',
  collectionYellow: '#F2E4BB',
  collectionPurple: '#E4CCE9',
  collectionTeal: '#C4E5DF',
};

export const LAYOUT = { page: 1200, reading: 720, form: 420 };

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
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};
