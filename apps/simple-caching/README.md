# Simple caching example

This app simply caches https://onehostname.com. Read the comments in index.js for some explanation.

## Running it

You'll need `node` and `fly` installed. Fly is installed via `npm -g install @fly/fly`.

```zsh
cd apps/simple-caching
fly server --port 9090
```

Then go to http://localhost:9090 to see the proxied website. Your first request should cache it in your local fly development server, susequent visits will be from that cache.

## Production

In a production app you may want to add `.fly.secrets.yml` to `.gitignore` if uploading it to a git repository, as this may be where you store secret keys in the future.

```zsh
# If you haven't alraedy
fly login
fly create some-app-name
# Your .fly.secrets.yml isn't used in production. This defines the variables in prod.
fly secrets set HOST https://onehostname.com --app some-app-name
fly hostnames add your-own-domain.com --app some-app-name
fly deploy
```

Login to https://fly.io, and you'll see your list of apps. Use the url provided (e.g. `some-app-name.edgeapp.net`) as the flattened CNAME, ALIAS or ANAME in your domain's DNS configuration.


