
# Example Static sites with Fly

Fly can serve small static sites very quickly. This is an example app that serves responses based on what's in `/files/`.

This example uses the `files` defined in the `.fly.yml` configuration, and `fetch('file://')` to retrieve them.

## Running the example

* Start the server `fly server static-site`
* Visit http://localhost:3000/