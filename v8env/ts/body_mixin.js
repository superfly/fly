"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BodyMixin {
    constructor(obj) {
        this.bodySource = obj;
        this.stream = null;
    }
    get body() {
        if (this.stream) {
            return this.stream;
        }
        if (this.bodySource instanceof ReadableStream) {
            this.stream = this.bodySource;
        }
        if (typeof this.bodySource === "string") {
            this.stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(this.bodySource);
                    controller.close();
                }
            });
        }
        if (!this.stream) {
            console.log("no stream:", this.bodySource);
        }
        return this.stream;
    }
    get bodyUsed() {
        if (this.body && this.body.locked) {
            return true;
        }
        return false;
    }
    async blob() {
        throw new Error("Blob not yet implemented");
    }
    async formData() {
        throw new Error("FormData not yet implemented");
    }
    async text() {
        if (typeof this.bodySource === "string") {
            return this.bodySource;
        }
        const arr = await this.arrayBuffer();
        return new TextDecoder('utf-8').decode(arr);
    }
    async json() {
        const raw = await this.text();
        return JSON.parse(raw);
    }
    async arrayBuffer() {
        if (this.bodySource instanceof ArrayBuffer) {
            return this.bodySource;
        }
        else if (typeof this.bodySource === 'string') {
            const enc = new TextEncoder("utf-8");
            return enc.encode(this.bodySource).buffer;
        }
        else if (this.bodySource instanceof ReadableStream) {
            return bufferFromStream(this.bodySource.getReader());
        }
        else if (!this.bodySource) {
            return new ArrayBuffer(0);
        }
        console.log("Unknown type:", this.bodySource instanceof ReadableStream);
        throw new Error("not yet implemented");
    }
}
exports.default = BodyMixin;
function bufferFromStream(stream) {
    return new Promise((resolve, reject) => {
        let parts = [];
        let encoder = new TextEncoder();
        // recurse
        (function pump() {
            stream.read()
                .then(({ done, value }) => {
                if (done) {
                    return resolve(concatenate(...parts));
                }
                if (typeof value === "string") {
                    parts.push(encoder.encode(value));
                }
                else if (value instanceof ArrayBuffer) {
                    parts.push(new Uint8Array(value));
                }
                else if (!value) {
                    // noop for undefined
                }
                else {
                    console.log("unhandled type on stream read:", value);
                    reject("unhandled type on stream read");
                }
                return pump();
            })
                .catch((err) => {
                reject(err);
            });
        })();
    });
}
function concatenate(...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new Uint8Array(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result.buffer;
}
//# sourceMappingURL=body_mixin.js.map