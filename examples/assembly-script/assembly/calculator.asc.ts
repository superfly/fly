export function add(a: int, b: int): int {
  return a + b;
}

export function subtract(a: int, b: int): int {
  return a - b;
}

export function multiply(a: int, b: int): int {
  return a * b;
}

export function divide(a: int, b: int): int {
  return a / b;
}

export function factorial(num: int): int {
  var tmp: int = num;

  if (num < 0) {
    return -1;
  } else if (num === 0) {
    return 1;
  }

  while (num > 2) {
    tmp *= num;
    num -= 1;
  }

  return tmp;
}

export function addWithLoopCount(count: int, a: int, b: int) {
  var i: int = 0;
  for (; i < count; i += 1) {
    add(a, b);
  }
}

export function subtractWithLoopCount(count: int, a: int, b: int) {
  var i: int = 0;
  for (; i < count; i += 1) {
    subtract(a, b);
  }
}

export function multiplyWithLoopCount(count: int, a: int, b: int) {
  var i: int = 0;
  for (; i < count; i += 1) {
    multiply(a, b);
  }
}

export function divideWithLoopCount(count: int, a: int, b: int) {
  var i: int = 0;
  for (; i < count; i += 1) {
    divide(a, b);
  }
}

export function factorialWithLoopCount(count: int, num: int) {
  var i: int = 0;
  for (; i < count; i += 1) {
    factorial(num);
  }
}