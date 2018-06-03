/*
  This file contains all your tracking logic.

  Use `import MatomoTracker from './tracker'` like you would use `var MatomoTracker = require('matomo-tracker');`

  As you can see, I've removed the `matomo.trackBulk()` function just while simplifying and developing, to make sure it wasn't the cause of any problems

*/

import MatomoTracker from 'fly-matomo'

/*

  Put these values in .fly.secrets.yml to run locally. Format:

  HOST: 'string'
  MATOMO_TRACKING_URL: 'string'
  MATOMO_AUTH_TOKEN: 'string'
  MATOMO_TRACKING_NUMBER: 0

  Then see .fly.yml and docs on how to do `fly secrets set KEY VALUE --app APP_NAME` => https://fly.io/docs/apps/#secrets

*/
const { MATOMO_TRACKING_URL, MATOMO_TRACKING_NUMBER, MATOMO_AUTH_TOKEN } = app.config

const matomo = new MatomoTracker(MATOMO_TRACKING_NUMBER, MATOMO_TRACKING_URL)

export default async function analytics (req, cached) {
  const url = new URL(req.url)
  const isFromCache = !!cached // optionally, I send in the cached version of the request. then use this to create a custom variable that tells me whether a particular request was cached or not. see line 39.

  const action = {
    event: {}
  }

  const path = url.pathname.toLowerCase().split('/')

  /* You may want to add these custom variables, or custom "dimensions" (I'm not sure which is more appropriate, sorry). Since we're caching most requests with Fly, wouldn't it be nice to know if it's a fresh request or a cache-derived one? */
  const cvar = {
    '1': ['origin', isFromCache ? 'fly' : 'direct'],
    '2': ['cached', isFromCache]
  }

  /* Example of examining the path to determine actions, etc */
  /*switch (path[1]) {
    case 'user': {
      action.name = 'Viewed user feed'
      action.event.category = 'Feed'
      action.event.action = 'view'
      action.event.name = `@${path[2].toLowerCase()}`
    }
      break

    default: {
      action.name = 'Viewed feed'
      action.event.category = 'Feed'
      action.event.action = 'view'
    }
  }*/

  const data = {
    url: url.href, // this will probably not be undefined, and should work for basic telemetry
    /*
      this is where you can other keys and values. see: https://developer.matomo.org/api-reference/tracking-api and https://www.npmjs.com/package/matomo-tracker
    */
  }

  try {
    await matomo.track(data)
  } catch (err) {
    console.error(err)
  }

  return
}
