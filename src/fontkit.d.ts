// Type definitions for fontkit v1.3.9
// Project: https://github.com/devongovett/fontkit
// Definitions by: John Hewson <https://github.com/jahewson>

// / <reference path="../node/node.d.ts" />

declare module 'fontkit' {
  function open(filename: string, callback?: (err: any, font: Font) => void): void;
  function open(filename: string, postscriptName: string, callback?: (err: any, font: Font) => void): void;
  function openSync(filename: string, postscriptName?: string): Font;
  function create(buffer: Buffer, postscriptName?: string): Font;

  type GID = number;
  type CodePoint = number;

  class BBox {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  }

  // Font
  // todo: awkward as there isn't actually a Font class in pdfkit (so `instanceof Font` won't work)
  class Font {
    // metadata
    postscriptName: string;
    fullName: string;
    familyName: string;
    subfamilyName: string;
    copyright: string;
    version: string;

    // metrics
    unitsPerEm: number;
    ascent: number;
    descent: number;
    lineGap: number;
    underlinePosition: number;
    underlineThickness: number;
    italicAngle: number;
    capHeight: number;
    xHeight: number;
    bbox: BBox;

    // other
    numGlyphs: number;
    characterSet: Array<string>;
    availableFeatures: Array<string>;

    // Character to glyph mapping
    glyphForCodePoint(codePoint: CodePoint): Glyph;
    hasGlyphForCodePoint(codePoint: CodePoint): boolean;
    glyphsForString(string: string): Array<GID>;

    // Glyph metrics and layout
    widthOfGlyph(glyphId: GID): number; // todo: this method does not seem to exist?
    layout(string: string, features?: Array<string>): GlyphRun;

    // Variation fonts - todo: given that this is a AAT feature, can this be moved to a subclass?
    variationAxes: { [axisTag: string]: VariationAxis };
    namedVariations: { [name: string]: VariationSettings };
    getVariation(name: string): Font;
    getVariation(axisTags: Array<string>): Font;

    // Other methods
    getGlyph(glyphId: GID, codePoints?: Array<CodePoint>): Glyph;
    createSubset(): Subset;
  }

  class TTFFont extends Font {
    // getTable();
  }

  class WOFFFont extends TTFFont {}

  class WOFF2Font extends TTFFont {}

  class TrueTypeCollection implements Collection {
    getFont(postscriptName: string): Font;
    fonts: Array<TTFFont>;
  }

  class DFont implements Collection{
    getFont(postscriptName: string): Font;
    fonts: Array<TTFFont>;
  }

  // Font Collection objects
  interface Collection {
    getFont(postscriptName: string): Font;
    fonts: Array<Font>;
  }

  class CFFFont {
    //string(sid: number): string;
    //topDict;
    //getCharString(glyph);
    //getGlyphName(gid);
    //fdForGlyph(gid);
    //privateDictForGlyph(gid);
  }

  interface VariationAxis {
    name: string;
    min: number;
    default: number;
    max: string;
  }

  type VariationSettings = { [axisTag: string]: number };

  class GlyphRun {
    glyphs: Array<Glyph>;
    positions: Array<GlyphPosition>;
    advanceWidth: number;
    advanceHeight: number;
    bbox: BBox;
  }

  class GlyphPosition {
    xAdvance: number;
    yAdvance: number;
    xOffset: number;
    yOffset: number;
  }

  class Glyph {
    id: GID;
    name: string;
    codePoints: Array<CodePoint>;
    path: Path;
    bbox: BBox;
    cbox: BBox;
    advanceWidth: number;
  }

  class COLRGlyph extends Glyph {
    getImageForSize(size: number): any;   // todo: what is this object?
    layers: Array<COLRLayer>;
  }

  class COLRLayer {
    glyph: Glyph;
    color: Color;
  }

  interface Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  }

  class Path {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    closePath(): void;
    toFunction(): Function; // todo: more specific type
    toSVG(): string;
    bbox: BBox;
    cbox: BBox;
  }

  class Subset {
    includeGlyph(glyphId: GID): void;
    includeGlyph(glyph: Glyph): void;
    encodeStream(): NodeJS.ReadableStream;
  }
}
