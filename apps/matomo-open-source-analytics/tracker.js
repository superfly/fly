/*
  IMPORTANT: see https://github.com/OKNoah/matomo-fly for updates. I can slso be found on https://fly.io/slack/ as @noah.

  # Matomo for fly.io edge apps

  The [official Matomo](https://github.com/matomo-org/matomo-nodejs-tracker) npm package didn't work for me, so I'm rewriting it to work in fly.io's [CDN](https://fly.io/articles/fly-edge-applications-global-javascript/) that you can program in Javascript.

  ## Smash that issue button

  Doesn't work for you? Let me know. I'm very tired. It barely works for me, there's not tests, god be with you.
*/


/**
 * A Node.js wrapper for the Matomo (http://matomo.org) tracking HTTP API
 * https://github.com/matomo-org/matomo-tracker
 *
 * @author  Frederic Hemberger, Matomo Team
 * @author Noah Gray
 * @license MIT
 */

import assert from 'assert'
import EventEmitter from 'events'

/**
 * @constructor
 * @param {Number} siteId     Id of the site you want to track
 * @param {String} trackerUrl URL of your Matomo instance
 * @param {Boolean} [true] noURLValidation Set to true if the `piwik.php` has been renamed
 */
class MatomoTracker extends EventEmitter {
  constructor (siteId, trackerUrl, noURLValidation) {
    super();

    if (!(this instanceof MatomoTracker)) {
      return new MatomoTracker(siteId, trackerUrl, noURLValidation);
    }

    assert.ok(siteId && (typeof siteId === 'number' || typeof siteId === 'string'), 'Matomo siteId required.');
    assert.ok(trackerUrl && typeof trackerUrl === 'string', 'Matomo tracker URL required, e.g. http://example.com/matomo.php');
    if (!noURLValidation) {
      assert.ok(trackerUrl.endsWith('matomo.php') || trackerUrl.endsWith('piwik.php'), 'A tracker URL must end with "matomo.php" or "piwik.php"');
    }

    this.siteId = siteId;
    this.trackerUrl = typeof trackerUrl === 'string' ? new URL(trackerUrl) : trackerUrl;

    this.track = this.track.bind(this);
  }

  /**
   * Executes the call to the Matomo tracking API
   *
   * For a list of tracking option parameters see
   * https://developer.matomo.org/api-reference/tracking-api
   *
   * @param {(String|Object)} options URL to track or options (must contain URL as well)
   */
  async track (options) {
    if (typeof options === 'string') {
      options = {
        url: options
      };
    }

    // Set mandatory options
    options = options || {};
    options.idsite = this.siteId;
    options.rec = 1;

    assert.ok(options.url, 'URL to be tracked must be specified.');

    const query = new URLSearchParams(options)
    this.trackerUrl.search = query

    await fetch(this.trackerUrl.href, {
      method: 'GET'
    });
  }
}

export default MatomoTracker;
