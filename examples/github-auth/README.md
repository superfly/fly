# Fly Example: GitHub Auth

This example uses Fly to authenticate to GitHub using OAuth.

Once you're authenticated, the app lets you create new issues using a form with validated fields. This ensures that new issues have all required fields to make it easier for maintainers to respond quickly and productively.

## What does it demonstrate?

- How Fly provides a load-balanced back-end with caching to enable quick authentication on the edge
- How you can use cookies to serve different content to different users
- How well Fly integrates with modern front-end frameworks like React (it's not just a back-end tool!)

## Usage

This repository includes (1) the back-end Fly code that handles the GitHub OAuth callback and (2) the front-end React code that provides a UI for authenticating and submitting issues. If you want to take this thing for a test-drive, you'll need to build both items separately.

### Fly server
```bash
# Install fly globally
npm install -g @fly/fly

# Install this example's dependencies
npm install

# Start the fly server
fly server

### React app
```javascript
// Install project dependencies
npm install

// Run the app in development mode
npm start

// Build production 
npm build
```

After building the React app, you can serve the compiled JavaScript directly from Fly using its distributed `files` store. See more details on that [here](https://fly.io/docs/apps/).

## Notes

### Efficient roundtrips

After a user authenticates, GitHub OAuth sends a temporary code to your app's server. You must `POST` this code back to GitHub to get a permanent access token. When this destination is Fly's global fleet of servers, roundtrips are much quicker.

### Fly is like your typical server, but much quicker

You _could_ build this app in lots of other places, but they probably wouldn't be as quick as this. Static files are served from Fly's distributed `files` store, so because they're closer to your users, they'll reach them quicker.

### Fully modern JavaScript environment

You get the benefits of some gnarly devops wrangling at your fingertips in an environment you're totally familiar with.