fly.http.respondWith(async (req) => {
	const css = await fetch('file://bootstrap.min.css');
	const html = await fetch ('file://hello.html');
	const minCSS = fly.CSS(await css.text(), await html.text());
	return new Response(minCSS, {
    headers: {
      "Content-Type": "text/css"
    }
  })
})
