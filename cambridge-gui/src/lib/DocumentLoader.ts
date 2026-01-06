
// Mock types locally if they don't exist yet
export type BookFormat = 'EPUB' | 'PDF' | 'MOBI';

// Import from our local copy of foliate-js
// Note: We use relative paths because we are in src/lib
// @ts-ignore
import * as epubcfi from './foliate-js/epubcfi.js';

export const CFI = epubcfi;

export interface BookMetadata {
    title: string;
    author: string;
    language: string;
    description?: string;
    coverImageBlobUrl?: string;
}

export interface BookDoc {
    metadata: BookMetadata;
    rendition?: {
        layout?: 'pre-paginated' | 'reflowable';
        spread?: 'auto' | 'none';
        viewport?: { width: number; height: number };
    };
    dir: string;
    toc?: Array<any>;
    sections?: Array<any>;
    transformTarget?: EventTarget;
    splitTOCHref(href: string): Array<string | number>;
    getCover(): Promise<Blob | null>;
}

export class DocumentLoader {
    private file: File | Blob;

    constructor(file: File | Blob) {
        this.file = file;
    }

    private async isZip(): Promise<boolean> {
        const arr = new Uint8Array(await this.file.slice(0, 4).arrayBuffer());
        return arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04;
    }

    private async makeZipLoader() {
        const { configure, ZipReader, BlobReader, TextWriter, BlobWriter } = await import(
            '@zip.js/zip.js'
        );

        configure({ useWebWorkers: false });
        // @ts-ignore
        const reader = new ZipReader(new BlobReader(this.file));
        const entries = await reader.getEntries();
        const map = new Map(entries.map((entry: any) => [entry.filename, entry]));

        const load =
            (f: (entry: any, type?: string) => Promise<string | Blob> | null) =>
                (name: string, ...args: [string?]) =>
                    map.has(name) ? f(map.get(name)!, ...args) : null;

        const loadText = load((entry: any) =>
            entry.getData ? entry.getData(new TextWriter()) : null,
        );
        const loadBlob = load((entry: any, type?: string) =>
            entry.getData ? entry.getData(new BlobWriter(type!)) : null,
        );
        const getSize = (name: string) => map.get(name)?.uncompressedSize ?? 0;

        return { entries, loadText, loadBlob, getSize, sha1: undefined };
    }

    public async open(): Promise<{ book: BookDoc; format: BookFormat }> {
        let book = null;
        let format: BookFormat = 'EPUB';

        // Simplification: We only support EPUB for now as that's what we download
        if (await this.isZip()) {
            console.log("DocumentLoader: File identified as ZIP.");
            const loader = await this.makeZipLoader();
            console.log("DocumentLoader: ZipLoader created. Importing EPUB class...");
            // @ts-ignore
            const { EPUB } = await import('./foliate-js/epub.js');
            console.log("DocumentLoader: EPUB class imported. Initializing...");
            book = await new EPUB(loader).init();
            console.log("DocumentLoader: EPUB initialized.");
            format = 'EPUB';
        } else {
            throw new Error('Unsupported file format');
        }

        return { book, format } as { book: BookDoc; format: BookFormat };
    }
}
