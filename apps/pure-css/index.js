fly.http.respondWith(async (req) => {
	const path = new URL(req.url).pathname
	if (path !== '/') {
		const file = await fetch('file:/' + path)
		const contents = await file.text()
		return new Response(contents, {
    	headers: {
      	"Content-Type": "text/html"
    	}
  	})
	}	
	const css = await fetch('file://bootstrap.min.css');
	const html = await fetch ('file://hello.html');
	const minCSS = fly.CSS(await css.text(), await html.text());
	return new Response(minCSS, {
    headers: {
      "Content-Type": "text/css"
    }
  })
})
