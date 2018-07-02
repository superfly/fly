fly.http.respondWith(async (request) => {
  const formData = await request.formData()
  console.log("FORM DATA:", formData.toString())
  formData.append('foo', 'bar')
  return new Response(formData)
})
