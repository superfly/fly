import { logger } from './logger.ts'

export interface Header { [s: string]: ByteString }
export interface HeaderMulti { [s: string]: ByteString | ByteString[] }

export type HeadersInit = Array<[ByteString, ByteString]> | HeaderMulti

export default class Headers implements Iterable<[ByteString, ByteString] | null> {
  private counter = 0
  private _headerList: Array<[ByteString, ByteString]>

  constructor(init?: Headers | HeadersInit) {
    this._headerList = new Array<[ByteString, ByteString]>()
    if (init) {
      fill(this, init)
    }
  }

  public [Symbol.iterator]() {
    const _this = this
    return {
      next(): IteratorResult<[ByteString, ByteString] | null> {
        if (_this.counter >= _this._headerList.length) {
          return { value: null, done: true }
        } else {
          return { value: _this._headerList[_this.counter++], done: false }
        }
      }
    }
  }

  append(name: ByteString, value: ByteString) {
    name = name.toLowerCase();
    this._headerList.push([name, value]);
  }

  delete(name: ByteString) {
    name = name.toLowerCase();
    var index = 0;
    while (index < this._headerList.length) {
      if (this._headerList[index][0] === name)
        this._headerList.splice(index, 1);
      else
        ++index;
    }
  }

  get(name: ByteString): ByteString | null {
    name = name.toLowerCase();
    var sequence = [];
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name)
        sequence.push(this._headerList[index][1]);
    }
    if (sequence.length === 0) {
      return null
    }
    return sequence.join(', ');
  }

  // get API doesn't work well with Set-Cookie header so we should keep this around
  getAll(name: ByteString): ByteString[] {
    name = name.toLowerCase();
    var sequence = [];
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name)
        sequence.push(this._headerList[index][1]);
    }
    return sequence;
  }


  has(name: ByteString): boolean {
    name = name.toLowerCase();
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name)
        return true;
    }
    return false;
  }

  set(name: ByteString, value: ByteString) {
    name = name.toLowerCase();
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name) {
        this._headerList[index++][1] = value;
        while (index < this._headerList.length) {
          if (this._headerList[index][0] === name)
            this._headerList.splice(index, 1);
          else
            ++index;
        }
        return;
      }
    }
    this._headerList.push([name, value]);
  }

  toJSON(): HeaderMulti {
    const jsonHeaders: HeaderMulti = {}
    for (let h of this._headerList) {
      if (h[0] === 'host') {
        jsonHeaders[h[0]] = String(this.get(h[0]))
        continue
      }

      logger.debug("setting", h[0], this.getAll(h[0]))
      jsonHeaders[h[0]] = this.getAll(h[0])
    }
    return jsonHeaders
  }

  toArray(): Array<[ByteString, ByteString]> {
    return this._headerList
  }
}

function fill(headers: Headers, init: Headers | HeadersInit) {
  if (init instanceof Headers) {
    for (let header of init) {
      if (header !== null) {
        headers.append(header[0], header[1])
      }
    }
  } else if (Array.isArray(init)) {
    init.forEach(function(header) {
      if (!Array.isArray(header) || header.length !== 2) throw TypeError();
      headers.append(header[0], header[1]);
    });
  } else {
    for (let key in init) {
      if (init[key] instanceof Array) {
        for (let val of init[key]) {
          headers.append(key, val)
        }
      } else {
        headers.append(key, String(init[key]))
      }
    }
  }

  return headers
}
