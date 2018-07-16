# Fly Example: GraphQL Stitching

This is a demonstration of using Fly to build an app that fetches data from GitHub and _quickly_ stitches in additional insights.

Specifically, the user picks a repository. The app fetches the last 50 issues in the repository through GitHub's API, evaluates the prevailing sentiment of each issue using a natural language processing algorithm, and then displays the combined results graphically.

Alternatively, you can make your own custom POST requests to `/custom` just like you would to `https://api.github.com/graphql` and sentiment will be added to _all_ issues in the response.

## What does it demonstrate?

- How to make APIs you already use quicker and even more useful
- How caching can help you responsibly get more utility out of public APIs without hitting rate limits
- How well Fly integrates with modern front-end frameworks like React (it's not just a back-end tool!).

## Usage

This repository includes (1) the back-end Fly code that does the fetching & stitching and (2) the front-end React code that makes the results look pretty. If you want to take this thing for a test-drive, you'll need to build both items separately.

### Fly server
```bash
# Install fly globally
npm install -g @fly/fly

# Install this example's dependencies
npm install

# Start the fly server
fly server

# Make a request to your favorite repo!
curl -X POST -H "Content-Type: text/plain" -H "Authorization: bearer <your token>" --data "{ \"query\": \"{ repository(owner: "superfly", name: "fly") { issues(first: 10) { edges { node { id title bodyText } } } } }\" }" https://api.github.com/graphql
```

### React app
```javascript
// Install project dependencies
npm install

// Run the app in development mode
npm start

// Build production 
npm build
```

After building the React app to your satisfaction, you can serve the compiled JavaScript directly from Fly using its distributed `files` store. See more details on that [here](https://fly.io/docs/apps/).

## Notes

### Fly is like your typical server, but much quicker and _everywhere_

You _could_ build this app in lots of other places, but they probably wouldn't be as blindingly quick as this.

![](https://i.imgur.com/QJ4Ohtq.gif)

### Fully modern JavaScript environment

You get the benefits of some gnarly devops wrangling at your fingertips in an environment you're totally familiar with.

### Simple server-side rendering, partials caching, etc

While storing JS and CSS assets on a distributed store is good, pre-rendering that JS before sending it to the user is even better. Fly is the perfect place to do it.