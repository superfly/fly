declare namespace Streams {
  interface ReadableStream {
    locked: boolean;

    getReader(): ReadableStreamReader;
    tee(): [ReadableStream, ReadableStream];
  }

  interface ReadableStreamController {
    enqueue(chunk: string | ArrayBuffer): void;
    close(): void;
  }


  interface ReadableStreamStatic {
    (source: any | undefined): ReadableStream;
    new(source: any | undefined): ReadableStream;
  }

  interface StreamsStatic {
    ReadableStream: ReadableStreamStatic;
    ReadableStreamController: ReadableStreamController;
  }
}

declare var ReadableStream: Streams.ReadableStreamStatic;

declare var Streams: Streams.StreamsStatic

declare module 'web-streams-polyfill' {
  export = Streams;
}
