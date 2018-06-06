# Fly Example: AssemblyScript

Demonstration of using Fly to build an app using [WebAssembly](https://webassembly.org) through [AssemblyScript](https://github.com/AssemblyScript/assemblyscript).

AssemblyScript is a language that closely resembles TypeScript. It compiles to WebAssembly.

## What does it demonstrate?

- Custom webpack config `webpack.fly.config.js`
- AssemblyScript webpack loader
- `tsconfig.json` tailored for AssemblyScript
- Uses compiled WebAssembly function results as a Response

## Usage

```bash
# Install fly globally
npm install -g @fly/fly

# Install this example's dependencies
npm install

# Start the fly server
fly server

# Make a request! (calculates the factorial of 10)
curl localhost:3000 # => 18144000
```

## Notes

### Fly supports WebAssembly (WASM)

As long as you can compile to `wasm`, you can run native code on Fly.

WebAssembly is a technology for running binary instructions on stack-based virtual machines such as the V8 javascript engine (the one Fly uses.) It provides fast and efficient cross-platform binaries you can run on any platform supporting WebAssembly.

### Webpack loaders are great shortcuts

We could've compiled the AssemblyScript separately, but it's less troublesome to compile it live using a webpack loader.

The loader also takes care of the boilerplate code to load a WebAssembly module.

### AssemblyScript is a strict subset of TypeScript

Since WebAssembly is typed, TypeScript seems like a good option to compile from. However, TypeScript does not have a compatible set of types to compile to WebAssembly as-is.

[AssemblyScript](https://github.com/AssemblyScript/assemblyscript) is a strongly typed alternative that uses a very similar syntax. It has [a few key differences](https://github.com/AssemblyScript/assemblyscript/wiki/Limitations), but it enables writing good old TypeScript to build native and faster-than-javascript code.

Head over to their [wiki](https://github.com/AssemblyScript/assemblyscript/wiki) for a trove of information about it!

## Acknowledgements

- [dongsik-yoo](https://github.com/dongsik-yoo) for building [assemblyscript-live-loader](https://github.com/dongsik-yoo/assemblyscript-live-loader) which we use in this example.