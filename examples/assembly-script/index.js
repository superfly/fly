import Calculator from './assembly/calculator.asc.ts'
const calc = new Calculator().exports

fly.http.respondWith(function (request) {
  return new Response(calc.factorial(10).toString());
})