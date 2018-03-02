fly.http.respondWith(async (request) => {
  const formData = await request.formData()
  formData.append('foo', 'bar')
  return new Response(formData)
})
