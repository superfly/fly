// mocha will complain otherwise
global.location = {}

mocha.run((failures) => {
  _mocha_done.apply(null, [failures])
})
