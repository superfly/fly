assert = require("assert")
http = require("http")
replay = require("../lib/replay")

http.get({ hostname: "www.iheartquotes.com", path: "/api/v1/random" }, function(response) {
  response.body = "";
  response.on("data", function(chunk) {
    response.body = response.body + chunk;
  })
  response.on("end", function() {

    // Now check the request we made to the I <3 Quotes API
    assert.equal(response.statusCode, 200);
    assert.equal(response.body, "Oxymoron 2. Exact estimate\n\n[codehappy] http://iheartquotes.com/fortune/show/38021\n");
    console.log("Woot!");

  })
})

