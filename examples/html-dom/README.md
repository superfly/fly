# HTML document (DOM) example

The Fly runtime includes an HTML DOM parser and CSS query engine that are useful for replacing contents of HTML files. This can be used to render HTML templates with dynamic data.

## Running the example

* Start the server `fly server html-dom`
* Visit these URLs:
  * http://localhost:3000/?firstName=Chance
  * http://localhost:3000/?firstName=Linda
  * http://localhost:3000/?firstName=Bae

Each request will return a different, dyanmically rendered HTML document personalized for the fictional names in the query params. The HTML also includes a timestamp, for extra dynamic-ness.

## How it works

The DOM parser converts strings into structured HTML documents.  In most Fly apps, the raw markup comes from a `fetch` method call — this example fetches the bundled `template.html`.

Once the raw markup is converted to a `Document` object, it looks for HTML elements to replace with content. For this example, elements with matching classes get replaced entirely.

## Where to go from here

This is a very simple example of templating within a Fly app. Most pure JavaScript templating systems (like Handlbars) work as is. React rendering works great in Fly apps as well, so you can render server side and client side with the same code.