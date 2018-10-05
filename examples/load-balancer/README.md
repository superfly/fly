# Application Load Balancer

This is a Fly App that works as an application load balancer. You can use it to route traffic to different backends, _or_ put it in front of other services distribute traffic based on whatever logic you desire.

It is designed to be a ready to go load balancer library you can mix and match with other Fly App code to do interesting things like add path routing rules, authentication, caching etc.

## Try it out

```bash
npm install -g @fly/fly
git clone https://github.com/superfly/load-balancer.git
cd load-balancer
yarn install
yarn start
```

## Make some changes
```bash
cd my-balancer
open index.ts
```

## How it works

The load balancer takes a list of `fetch` functions, tracks statistics for each, and attempts to intelligently distribute requests to each.  The `fetch` functions can wrap logic for any kind of backend service, the example just makes simple HTTP proxies using `@fly/proxy` to example domains.

This example is written in TypeScript. Compiler enforced types are really nice for algorithms like this, since the compiler itself can help limit complexity. Have a look at the `[webpack.fly.config.js](https://github.com/superfly/fly/blob/master/examples/load-balancer/webpack.fly.config.js)` to see how TypeScript works with Fly.

### Backend health

Backends get a health score calculated using a time decaying error rate. Each backend tracks the last 10 responses, calculates an "error percentage", and then weights it based on the age of the most recent error.

### 2 Random choices

The backend selector chooses two backends with the highest current health score, then "flips a coin" to decide which to send a request to. This is a basic implementation of a "[2 random choices](https://fly.io/articles/simple-wins-power-of-2-load-balancing/)" algorithm.

### Retries

For `GET` and `HEAD` requests, the balancer will attempt to [retry](https://github.com/superfly/fly/blob/master/examples/load-balancer/src/balancer.ts#L136-L140) failed requests.