import type { BookMetadata } from '../lib/DocumentLoader';

export type BookFormat = 'EPUB' | 'PDF' | 'MOBI' | 'AZW' | 'AZW3' | 'CBZ' | 'FB2' | 'FBZ';
export type BookNoteType = 'bookmark' | 'annotation' | 'excerpt';
export type HighlightStyle = 'highlight' | 'underline' | 'squiggly';
export type HighlightColor = 'red' | 'yellow' | 'green' | 'blue' | 'violet';

export interface TextSelection {
    text: string;
    index: number;
    range: Range;
}

export const FIXED_LAYOUT_FORMATS: Set<BookFormat> = new Set(['PDF', 'CBZ']);

export interface Book {
    // Compatibility fields for Dashboard/Legacy
    id: string;
    isbn: string | null;
    cover: string | null;
    [key: string]: any; // Allow dynamic properties for legacy support

    url?: string;
    filePath?: string;
    hash: string;
    metaHash?: string;
    format: BookFormat;
    title: string;
    sourceTitle?: string;
    author: string;
    groupId?: string;
    groupName?: string;
    tags?: string[];
    coverImageUrl?: string | null;

    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;

    uploadedAt?: number | null;
    downloadedAt?: number | null;
    coverDownloadedAt?: number | null;
    syncedAt?: number | null;

    lastUpdated?: number;
    progress?: [number, number];
    primaryLanguage?: string;

    metadata?: BookMetadata;
    is_downloaded?: boolean;
}

export interface PageInfo {
    current: number;
    next?: number;
    total: number;
}

export interface TimeInfo {
    section: number;
    total: number;
}

export interface BookNote {
    bookHash?: string;
    metaHash?: string;
    id: string;
    type: BookNoteType;
    cfi: string;
    text?: string;
    style?: HighlightStyle;
    color?: HighlightColor;
    note: string;

    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
}

export type WritingMode = 'auto' | 'horizontal-tb' | 'horizontal-rl' | 'vertical-rl';

export interface BookLayout {
    marginTopPx: number;
    marginBottomPx: number;
    marginLeftPx: number;
    marginRightPx: number;
    compactMarginTopPx: number;
    compactMarginBottomPx: number;
    compactMarginLeftPx: number;
    compactMarginRightPx: number;
    gapPercent: number;
    scrolled: boolean;
    disableClick: boolean;
    fullscreenClickArea: boolean;
    swapClickArea: boolean;
    disableDoubleClick: boolean;
    volumeKeysToFlip: boolean;
    continuousScroll: boolean;
    maxColumnCount: number;
    maxInlineSize: number;
    maxBlockSize: number;
    animated: boolean;
    isEink: boolean;
    writingMode: WritingMode;
    vertical: boolean;
    rtl: boolean;
    scrollingOverlap: number;
    allowScript: boolean;
}

export interface BookStyle {
    zoomLevel: number;
    paragraphMargin: number;
    lineHeight: number;
    wordSpacing: number;
    letterSpacing: number;
    textIndent: number;
    fullJustification: boolean;
    hyphenation: boolean;
    invertImgColorInDark: boolean;
    theme: string;
    overrideFont: boolean;
    overrideLayout: boolean;
    overrideColor: boolean;
    backgroundTextureId: string;
    backgroundOpacity: number;
    backgroundSize: string;
    codeHighlighting: boolean;
    codeLanguage: string;
    userStylesheet: string;
    userUIStylesheet: string;

    zoomMode: 'fit-page' | 'fit-width' | 'original-size' | 'custom';
    spreadMode: 'auto' | 'none';
    keepCoverSpread: boolean;
}

export interface BookFont {
    serifFont: string;
    sansSerifFont: string;
    monospaceFont: string;
    defaultFont: string;
    defaultCJKFont: string;
    defaultFontSize: number;
    minimumFontSize: number;
    fontWeight: number;
}

export type ConvertChineseVariant = 'none' | 's2t' | 't2s' | 's2tw' | 's2hk' | 's2twp' | 'tw2s' | 'hk2s' | 'tw2sp';

export interface BookLanguage {
    replaceQuotationMarks: boolean;
    convertChineseVariant: ConvertChineseVariant;
}

export interface ViewConfig {
    sideBarTab: string;
    uiLanguage: string;
    sortedTOC: boolean;

    doubleBorder: boolean;
    borderColor: string;

    showHeader: boolean;
    showFooter: boolean;
    showRemainingTime: boolean;
    showRemainingPages: boolean;
    showProgressInfo: boolean;
    showBarsOnScroll: boolean;
    showMarginsOnScroll: boolean;
    progressStyle: 'percentage' | 'fraction';
    progressInfoMode: 'remaining' | 'progress' | 'all' | 'none';
}

export interface TTSConfig {
    ttsRate: number;
    ttsVoice: string;
    ttsLocation: string;
    showTTSBar: boolean;
}

export interface TranslatorConfig {
    translationEnabled: boolean;
    translationProvider: string;
    translateTargetLang: string;
    showTranslateSource: boolean;
    ttsReadAloudText: string;
}

export interface ScreenConfig {
    screenOrientation: 'auto' | 'portrait' | 'landscape';
}

export interface ProofreadRulesConfig {
    proofreadRules?: any[];
}

export interface ViewSettings
    extends BookLayout,
    BookStyle,
    BookFont,
    BookLanguage,
    ViewConfig,
    TTSConfig,
    TranslatorConfig,
    ScreenConfig,
    ProofreadRulesConfig { }

export interface BookProgress {
    location: string;
    sectionId: number;
    sectionHref: string;
    sectionLabel: string;
    section: PageInfo;
    pageinfo: PageInfo;
    timeinfo: TimeInfo;
    range: Range;
}

export interface BookConfig {
    bookHash?: string;
    metaHash?: string;
    progress?: [number, number];
    location?: string;
    xpointer?: string;
    booknotes?: BookNote[];
    viewSettings?: Partial<ViewSettings>;
    updatedAt: number;
}

export interface BookDataRecord {
    id: string;
    book_hash: string;
    meta_hash?: string;
    user_id: string;
    updated_at: number | null;
    deleted_at: number | null;
}

export interface BookContent {
    book: Book;
    file: File;
}

export interface BookSearchConfig {
    query: string;
    // Add other properties as needed
}

export interface BookSearchResult {
    cfi: string;
    label: string;
    // Add other properties as needed
}

// Re-export BookMetadata if it was imported but not exported in line 1
// Ideally, line 1 should be `import type { BookMetadata } from ...` and we might not need to re-define it if we use it.
// But the error said `BookMetadata` type must be imported using type-only.
// Let's check imports. ensure line 1 is `import type`.

