import db from '@fly/data'

fly.http.respondWith(async function (request) {
  const coll = db.collection("testing")
  await coll.put("id", { foo: "bar" })
  return new Response(JSON.stringify(await coll.get("id")))
})