/**
 * @module fly
 */
/**
 * Tools for manipulating HTML + DOM content.
 * 
 * 
 * ```javascript
 * const html = '<html><head></head><body><h1>Hello</h1></body</html>'
 * let doc = fly.html.Document.parse(html)
 * console.log(doc.querySelector('h1').textContent
 * ```
 */
/**
 * Common functionality for DOM based classes. This class should not be
 * use directly.
 */
declare abstract class Node {
  /**
   * Get a single Element by CSS selector
   * @param selector The css selector to query for
   */
  public querySelector(selector: string): Element | null
  /**
   * Get all Elements by CSS selector
   * @param selector The css selector to query for
   */
  public querySelectorAll(selector: string): Element[]

  /**
   * Any child Elements, these are what normally get queried.
   */
  public children: Element[]
}
/**
 * A Document represents an HTML in its parsed DOM format.
 * 
 * ```javascript
 * const html = '<html><head></head><body><h1>Hello</h1></body</html>'
 * let doc = Document.parse(html)
 * console.log(doc.querySelector('h1').textContent
 * ```
 */
export class Document extends Node {
  /**
   * Parses HTML into a Document that can be queried and modified.
   * @param html The raw HTML to parse into a Document + DOM
   */
  public static parse(html: string): Document

  /**
   * Find an element by its ID.
   * @param id The id=<id> attribute to query for
   */
  public getElementById(id: string): Element

}
export class Element extends Node {
  /**
   * The Element's ID
   */
  public readonly id: string
  /**
   * HTML within the element, not including the Element itself.
   */
  public readonly innerHTML: string
  /**
   * HTML for the full Element and all its contents.
   */
  public readonly outerHTML: string
  /**
   * Text content of element, minus and markup
   */
  public readonly textContent: string

  public replaceWith(html: string | Element): void
  public getAttribute(name: string): string | null
  public setAttribute(name: string, value: string): void
}