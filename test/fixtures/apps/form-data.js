fly.http.respondWith(function(request) {
  const formData = new FormData()
  formData.append('foo', 'bar')
  return new Response(formData)
})
