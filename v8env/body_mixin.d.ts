declare type BodySource = Blob | BufferSource | FormData | URLSearchParams | ReadableStream | String;
declare class BodyMixin implements Body {
    private readonly bodySource;
    private stream;
    constructor(obj: BodySource);
    readonly body: ReadableStream | null;
    readonly bodyUsed: boolean;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    text(): Promise<string>;
    json(): Promise<any>;
    arrayBuffer(): Promise<ArrayBuffer>;
}
