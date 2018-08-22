fly.http.respondWith(async function (req) {
  const good = await fetch("file://dummy.txt")
  const bad = await fetch("file://no-file-dummy.txt")

  if (bad.status != 404) {
    return new Response(`Wrong status when not found: ${bad.status}`, { status: 500 })
  }
  if (good.status != 200) {
    return new Response(`Wrong status when found: ${good.status}`, { status: 500 })
  }

  return good
})