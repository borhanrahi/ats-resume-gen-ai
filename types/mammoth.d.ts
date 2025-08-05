declare module 'mammoth' {
  export interface Message {
    type: 'warning' | 'error';
    message: string;
  }

  export interface Result<T> {
    value: T;
    messages: Message[];
  }

  export interface Options {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export interface ConvertToHtmlOptions extends Options {
    styleMap?: string[];
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
    convertImage?: (image: unknown) => { src: string } | Promise<{ src: string }>;
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
  }

  export interface ExtractRawTextOptions extends Options {}

  export function convertToHtml(options: ConvertToHtmlOptions): Promise<Result<string>>;
  export function extractRawText(options: ExtractRawTextOptions): Promise<Result<string>>;
  export function convertToMarkdown(options: Options): Promise<Result<string>>;
  export function images(options: Options): Promise<Result<unknown[]>>;
}