/**
 * @namespace fly
 */
module.exports = function(ivm, dispatch){
  return {
    cache: require('./cache')(ivm,dispatch)
  }
}