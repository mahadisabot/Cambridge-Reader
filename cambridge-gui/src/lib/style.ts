export interface ViewSettings {
    serifFont?: string;
    sansSerifFont?: string;
    monospaceFont?: string;
    defaultFont?: string;
    defaultCJKFont?: string;
    defaultFontSize?: number;
    minimumFontSize?: number;
    fontWeight?: number;
    overrideFont?: boolean;
    overrideColor?: boolean;
    invertImgColorInDark?: boolean;
    backgroundTextureId?: string;
    isEink?: boolean;
    showTranslateSource?: boolean;
    userStylesheet?: string;
    // Layout
    overrideLayout?: boolean;
    marginTopPx?: number;
    marginRightPx?: number;
    marginBottomPx?: number;
    marginLeftPx?: number;
    paragraphMargin?: number;
    lineHeight?: number;
    wordSpacing?: number;
    letterSpacing?: number;
    textIndent?: number;
    fullJustification?: boolean;
    hyphenation?: boolean;
    writingMode?: string;
    vertical?: boolean;
    zoomLevel?: number;
    doubleBorder?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    showTTSBar?: boolean;
    showMarginsOnScroll?: boolean;
    scrolled?: boolean;
    animated?: boolean;
    maxColumnCount?: number;
    maxBlockSize?: number;
    screenOrientation?: string;
    gapPercent?: number;
    spreadMode?: 'auto' | 'none';
    keepCoverSpread?: boolean;
    zoomMode?: string;
}

export interface Palette {
    primary: string;
    'base-100': string;
    'base-content': string;
    [key: string]: string;
}

export interface ThemeCode {
    bg: string;
    fg: string;
    primary: string;
    palette: Palette;
    isDarkMode: boolean;
}

const MONOSPACE_FONTS = ['Consolas', 'Monaco', 'Courier New', 'monospace'];
const SANS_SERIF_FONTS = ['Arial', 'Helvetica', 'Verdana', 'sans-serif'];
const SERIF_FONTS = ['Georgia', 'Times New Roman', 'serif'];
const FALLBACK_FONTS = ['serif', 'sans-serif', 'monospace'];
const CJK_SANS_SERIF_FONTS: string[] = [];
const CJK_SERIF_FONTS: string[] = [];

const getFontStyles = (
    serif = 'Georgia',
    sansSerif = 'Arial',
    monospace = 'Consolas',
    defaultFont = 'serif',
    defaultCJKFont = 'sans-serif',
    fontSize = 16,
    minFontSize = 12,
    fontWeight = 400,
    overrideFont = false,
) => {
    const lastSerifFonts = ['Georgia', 'Times New Roman'];
    const serifFonts = [
        serif,
        ...(defaultCJKFont !== serif ? [defaultCJKFont] : []),
        ...SERIF_FONTS.filter(
            (font) => font !== serif && font !== defaultCJKFont && !lastSerifFonts.includes(font),
        ),
        ...CJK_SERIF_FONTS.filter((font) => font !== serif && font !== defaultCJKFont),
        ...lastSerifFonts.filter(
            (font) => SERIF_FONTS.includes(font) && !lastSerifFonts.includes(defaultCJKFont),
        ),
        ...FALLBACK_FONTS,
    ];
    const sansSerifFonts = [
        sansSerif,
        ...(defaultCJKFont !== sansSerif ? [defaultCJKFont] : []),
        ...SANS_SERIF_FONTS.filter((font) => font !== sansSerif && font !== defaultCJKFont),
        ...CJK_SANS_SERIF_FONTS.filter((font) => font !== sansSerif && font !== defaultCJKFont),
        ...FALLBACK_FONTS,
    ];
    const monospaceFonts = [monospace, ...MONOSPACE_FONTS.filter((font) => font !== monospace)];
    const defaultFontFamily = defaultFont.toLowerCase() === 'serif' ? '--serif' : '--sans-serif';
    const fontStyles = `
    html {
      --serif: ${serifFonts.map((font) => `"${font}"`).join(', ')}, serif;
      --sans-serif: ${sansSerifFonts.map((font) => `"${font}"`).join(', ')}, sans-serif;
      --monospace: ${monospaceFonts.map((font) => `"${font}"`).join(', ')}, monospace;
      --font-size: ${fontSize}px;
      --min-font-size: ${minFontSize}px;
      --font-weight: ${fontWeight};
    }
    html, body {
      font-size: ${fontSize}px !important;
      font-weight: ${fontWeight};
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    }
    /* lower specificity than ebook built-in font styles */
    html {
      font-family: var(${defaultFontFamily}) ${overrideFont ? '!important' : ''};
    }
    /* higher specificity than ebook built-in font styles */
    html body {
      ${overrideFont ? `font-family: var(${defaultFontFamily}) !important;` : ''}
    }
    font[size="1"] {
      font-size: ${minFontSize}px;
    }
    font[size="2"] {
      font-size: ${minFontSize * 1.5}px;
    }
    font[size="3"] {
      font-size: ${fontSize}px;
    }
    font[size="4"] {
      font-size: ${fontSize * 1.2}px;
    }
    font[size="5"] {
      font-size: ${fontSize * 1.5}px;
    }
    font[size="6"] {
      font-size: ${fontSize * 2}px;
    }
    font[size="7"] {
      font-size: ${fontSize * 3}px;
    }
    /* hardcoded inline font size */
    [style*="font-size: 16px"], [style*="font-size:16px"] {
      font-size: 1rem !important;
    }
    pre, code, kbd {
      font-family: var(--monospace);
    }
    body *:not(pre, code, kbd, .code):not(pre *, code *, kbd *, .code *) {
      ${overrideFont ? 'font-family: revert !important;' : ''}
    }
  `;
    return fontStyles;
};

const getColorStyles = (
    overrideColor: boolean,
    invertImgColorInDark: boolean,
    themeCode: ThemeCode,
    backgroundTextureId: string,
    isEink: boolean,
) => {
    const { bg, fg, primary, isDarkMode } = themeCode;
    const colorStyles = `
    html {
      --bg-texture-id: ${backgroundTextureId || 'none'};
      --theme-bg-color: ${bg};
      --theme-fg-color: ${fg};
      --theme-primary-color: ${primary};
      --override-color: ${overrideColor};
      color-scheme: ${isDarkMode ? 'dark' : 'light'};
    }
    html, body {
      color: ${fg};
    }
    html[has-background], body[has-background] {
      --background-set: var(--theme-bg-color);
    }
    html {
      background-color: var(--theme-bg-color, transparent);
      background: var(--background-set, none);
    }
    section, aside, blockquote, article, nav, header, footer, main, figure,
    div, p, font, h1, h2, h3, h4, h5, h6, li, span {
      ${overrideColor ? `background-color: ${bg} !important;` : ''}
      ${overrideColor ? `color: ${fg} !important;` : ''}
      ${overrideColor ? `border-color: ${fg} !important;` : ''}
    }
    pre, span { /* inline code blocks */
      ${overrideColor ? `background-color: ${bg} !important;` : ''}
    }
    a:any-link {
      ${overrideColor ? `color: ${primary};` : isDarkMode ? `color: lightblue;` : ''}
      text-decoration: ${isEink ? 'underline' : 'none'};
    }
    body.pbg {
      ${isDarkMode ? `background-color: ${bg} !important;` : ''}
    }
    img {
      ${isDarkMode && invertImgColorInDark ? 'filter: invert(100%);' : ''}
      ${!isDarkMode && overrideColor ? 'mix-blend-mode: multiply;' : ''}
    }
    /* horizontal rule #1649 */
    *:has(> hr[class]):not(body) {
      background-color: ${bg};
    }
    hr {
      mix-blend-mode: multiply;
    }
    /* inline images */
    p img, span img, sup img {
      mix-blend-mode: ${isDarkMode ? 'screen' : 'multiply'};
    }
    /* code */
    body.theme-dark code {
      ${isDarkMode ? `color: ${fg}cc;` : ''}
      ${isDarkMode ? `background: color-mix(in srgb, ${bg} 90%, #000);` : ''}
      ${isDarkMode ? `background-color: color-mix(in srgb, ${bg} 90%, #000);` : ''}
    }
    blockquote {
      ${isDarkMode ? `background: color-mix(in srgb, ${bg} 80%, #000);` : ''}
    }
    blockquote, table * {
      ${isDarkMode && overrideColor ? `background: color-mix(in srgb, ${bg} 80%, #000);` : ''}
      ${isDarkMode && overrideColor ? `background-color: color-mix(in srgb, ${bg} 80%, #000);` : ''}
    }
  `;
    return colorStyles;
};

const getLayoutStyles = (
    overrideLayout = false,
    marginTop = 40,
    marginRight = 40,
    marginBottom = 40,
    marginLeft = 40,
    paragraphMargin = 1,
    lineSpacing = 1.5,
    wordSpacing = 0,
    letterSpacing = 0,
    textIndent = 0,
    justify = false,
    hyphenate = false,
    zoomLevel = 1,
    writingMode = 'horizontal-tb',
    vertical = false,
) => {
    const layoutStyle = `
  @namespace epub "http://www.idpf.org/2007/ops";
  html {
    --default-text-align: ${justify ? 'justify' : 'start'};
    --margin-top: ${marginTop}px;
    --margin-right: ${marginRight}px;
    --margin-bottom: ${marginBottom}px;
    --margin-left: ${marginLeft}px;
    hanging-punctuation: allow-end last;
    orphans: 2;
    widows: 2;
  }
  [align="left"] { text-align: left; }
  [align="right"] { text-align: right; }
  [align="center"] { text-align: center; }
  [align="justify"] { text-align: justify; }
  
  html, body {
    ${writingMode === 'auto' ? '' : `writing-mode: ${writingMode} !important;`}
    ${vertical ? 'font-feature-settings: "vrt2" 1, "vert" 1; text-orientation: upright;' : ''}
    text-align: var(--default-text-align);
    max-height: unset;
  }
  body {
    overflow: unset;
    zoom: ${zoomLevel};
  }
  svg, img {
    height: auto;
    width: auto;
    background-color: transparent !important;
  }
  p, blockquote, dd, div:not(:has(*:not(b, a, em, i, strong, u, span))) {
    line-height: ${lineSpacing} ${overrideLayout ? '!important' : ''};
    word-spacing: ${wordSpacing}px ${overrideLayout ? '!important' : ''};
    letter-spacing: ${letterSpacing}px ${overrideLayout ? '!important' : ''};
    text-indent: ${textIndent}em ${overrideLayout ? '!important' : ''};
    -webkit-hyphens: ${hyphenate ? 'auto' : 'manual'};
    hyphens: ${hyphenate ? 'auto' : 'manual'};
  }
  p {
    margin-top: ${paragraphMargin}em ${overrideLayout ? '!important' : ''};
    margin-bottom: ${paragraphMargin}em ${overrideLayout ? '!important' : ''};
  }
  `;
    return layoutStyle;
};

export const getStyles = (viewSettings: ViewSettings, themeCode: ThemeCode) => {
    const layoutStyles = getLayoutStyles(
        viewSettings.overrideLayout,
        viewSettings.marginTopPx,
        viewSettings.marginRightPx,
        viewSettings.marginBottomPx,
        viewSettings.marginLeftPx,
        viewSettings.paragraphMargin,
        viewSettings.lineHeight,
        viewSettings.wordSpacing,
        viewSettings.letterSpacing,
        viewSettings.textIndent,
        viewSettings.fullJustification,
        viewSettings.hyphenation,
        1.0,
        viewSettings.writingMode,
        viewSettings.vertical,
    );

    const fontStyles = getFontStyles(
        viewSettings.serifFont,
        viewSettings.sansSerifFont,
        viewSettings.monospaceFont,
        viewSettings.defaultFont,
        viewSettings.defaultCJKFont,
        viewSettings.defaultFontSize,
        viewSettings.minimumFontSize,
        viewSettings.fontWeight,
        viewSettings.overrideFont,
    );

    const colorStyles = getColorStyles(
        viewSettings.overrideColor || false,
        viewSettings.invertImgColorInDark || false,
        themeCode,
        viewSettings.backgroundTextureId || '',
        viewSettings.isEink || false,
    );

    const userStylesheet = viewSettings.userStylesheet || '';
    return `${layoutStyles}\n${fontStyles}\n${colorStyles}\n${userStylesheet}`;
};

export const applyThemeModeClass = (document: Document, isDarkMode: boolean) => {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(isDarkMode ? 'theme-dark' : 'theme-light');
};

export const applyScrollModeClass = (document: Document, isScrollMode: boolean) => {
    document.body.classList.remove('scroll-mode', 'paginated-mode');
    document.body.classList.add(isScrollMode ? 'scroll-mode' : 'paginated-mode');
};
