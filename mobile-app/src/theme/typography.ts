const font = {
  family: 'Roboto',
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const typography = {
  font,
  display: {
    d1Semibold: {
      fontFamily: font.family,
      fontSize: 46,
      lineHeight: 55,
      fontWeight: font.weight.semibold,
    },
    d2Semibold: {
      fontFamily: font.family,
      fontSize: 42,
      lineHeight: 50,
      fontWeight: font.weight.semibold,
    },
    d3Semibold: {
      fontFamily: font.family,
      fontSize: 36,
      lineHeight: 43,
      fontWeight: font.weight.semibold,
    },
  },
  heading: {
    h1Bold: {
      fontFamily: font.family,
      fontSize: 32,
      lineHeight: 38,
      fontWeight: font.weight.bold,
    },
    h2Semibold: {
      fontFamily: font.family,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: font.weight.semibold,
    },
    h3Regular: {
      fontFamily: font.family,
      fontSize: 24,
      lineHeight: 29,
      fontWeight: font.weight.regular,
    },
    h4Medium: {
      fontFamily: font.family,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: font.weight.medium,
    },
    h5Semibold: {
      fontFamily: font.family,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: font.weight.semibold,
    },
    h6Medium: {
      fontFamily: font.family,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: font.weight.medium,
    },
    h7Medium: {
      fontFamily: font.family,
      fontSize: 16,
      lineHeight: 19,
      fontWeight: font.weight.medium,
    },
    h8Semibold: {
      fontFamily: font.family,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: font.weight.semibold,
    },
  },
  bodyScale: {
    xlRegular: {
      fontFamily: font.family,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: font.weight.regular,
    },
    xlMedium: {
      fontFamily: font.family,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: font.weight.medium,
    },
    lRegular: {
      fontFamily: font.family,
      fontSize: 16,
      lineHeight: 19,
      fontWeight: font.weight.regular,
    },
    mBold: {
      fontFamily: font.family,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: font.weight.bold,
    },
    mMedium: {
      fontFamily: font.family,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: font.weight.medium,
    },
    mRegular: {
      fontFamily: font.family,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: font.weight.regular,
    },
    xmMedium: {
      fontFamily: font.family,
      fontSize: 12,
      lineHeight: 14,
      fontWeight: font.weight.medium,
    },
    xmRegular: {
      fontFamily: font.family,
      fontSize: 12,
      lineHeight: 14,
      fontWeight: font.weight.regular,
    },
  },
  button: {
    xlRegular: {
      fontFamily: font.family,
      fontSize: 24,
      lineHeight: 29,
      fontWeight: font.weight.regular,
    },
    xlMedium: {
      fontFamily: font.family,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: font.weight.medium,
    },
    lRegular: {
      fontFamily: font.family,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: font.weight.regular,
    },
    lMedium: {
      fontFamily: font.family,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: font.weight.medium,
    },
    mRegular: {
      fontFamily: font.family,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: font.weight.regular,
    },
    mMedium: {
      fontFamily: font.family,
      fontSize: 16,
      lineHeight: 19,
      fontWeight: font.weight.medium,
    },
    sRegular: {
      fontFamily: font.family,
      fontSize: 16,
      lineHeight: 19,
      fontWeight: font.weight.regular,
    },
    sMedium: {
      fontFamily: font.family,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: font.weight.medium,
    },
    xsRegular: {
      fontFamily: font.family,
      fontSize: 14,
      lineHeight: 17,
      fontWeight: font.weight.regular,
    },
    xsMedium: {
      fontFamily: font.family,
      fontSize: 12,
      lineHeight: 14,
      fontWeight: font.weight.medium,
    },
  },
  captionScale: {
    lRegular: {
      fontFamily: font.family,
      fontSize: 12,
      lineHeight: 14,
      fontWeight: font.weight.regular,
    },
    mRegular: {
      fontFamily: font.family,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: font.weight.regular,
    },
  },
  // Backward compatibility aliases used by current screens.
  heading1: {
    fontFamily: font.family,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: font.weight.bold,
  },
  heading5: {
    fontFamily: font.family,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: font.weight.semibold,
  },
  body: {
    fontFamily: font.family,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: font.weight.regular,
  },
  caption: {
    fontFamily: font.family,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: font.weight.regular,
  },
} as const;
