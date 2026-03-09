declare module 'pdfkit' {
  class PDFDocument extends NodeJS.ReadableStream {
    constructor(options?: any);
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    rect(x: number, y: number, width: number, height: number): this;
    fill(): this;
    end(): void;
    on(event: string, callback: any): this;
  }

  export default PDFDocument;
}
