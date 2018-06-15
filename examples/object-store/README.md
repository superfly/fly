# Fly Example: Object Storage

Fly includes a globally-distributed object store.

## Use cases

Generally storing dynamic configuration data:
- List of allowed referrers
- User preferences
- ... a lot more!

## Usage

```bash
# Install fly globally
npm install -g @fly/fly

# Start the fly server
fly server

# Make a request!
curl localhost:3000 # => {"foo":"bar"}
```