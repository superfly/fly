# Contributing to Fly

Thank you so much for checking out our superfly community! We appreciate and thank you for considering contributing to Fly. We'd like to make it as easy as possible for you to get started, so read on to learn how.

## Where to start?

If you want to suggest a new feature, noticed a bug, or have a question, [search the issue tracker](https://github.com/superfly/fly/issues) to see if
someone else in the community has already created a ticket. If not, go ahead and create a shiny, new issue
[here](https://github.com/superfly/fly/issues/new)!

## Workflow

The core team uses the [Pull Request workflow](https://guides.github.com/introduction/flow/) for all of our development. Each pull request is automatically tested and verified by our continuous integration system which is reported live on the pull request. Once all checks pass, someone on the core team will review the code and either sign off or provide feedback. After the change is signed off, the pull request will be merged into `master`. Note that `master` is not immediately published, so there might be a delay before the updated packages are live on npm. 

We try to work through pull requests as quickly as we can, but some large or far reaching changes may take longer.

### 1. Fork & create a branch

When you're ready to start contributing, [fork Fly](https://help.github.com/articles/fork-a-repo/) and clone to your machine:

```sh
git clone https://github.com/<your_username>/fly
cd fly

```

Next, create a branch from `master` with a descriptive name.

```sh
git checkout -b <your-branch>
```

A good branch name, for example, where issue #156 is the ticket you're working on, would be `156-update-docs`.

### 2. Install dependencies

Fly uses [Yarn](https://yarnpkg.com/en/) to manage dependencies and run development scripts. If you don't already have yarn installed, follow [these directions](https://yarnpkg.com/en/docs/install).

```sh
yarn install
```

Fly also includes 3rd party dependencies as git submodules. Initialize them with:

```sh
git submodule update --init
```

### 3. Get the test suite running

Build the code and bundle for execution:

```sh
yarn build
yarn bundle
```

You can now run the test suite:

```sh
yarn test
```

If the test suite passed, you're environment is ready to go.

### 4. Make your changes

You're now ready to make your changes! 

If you add code that should be tested, which is usually the case, please add tests. You'll need to recompile using `yarn build` to see your changes. You can also use `yarn build:watch` to continually watch and build. Changes to `v8env` also need to be bundled with `yarn bundle` to take effect. 

### 5. Make a Pull Request

Once you're happy with your changes and the test suite is passing locally, it's time to prepare your code for a pull request.

It's good practice to update your code with the lastest changes on fly's `master` branch before publishing. To do this you'll need to update your local copy of master and merge any changes into your branch:

```sh
git remote add upstream https://github.com/superfly/fly.git
git fetch upstream master
git rebase upstream/master
```

Then, push code to your fork:

```sh
git push --set-upstream origin <your-branch>
```

Finally, go to GitHub and [make a Pull Request](https://github.com/superfly/fly/compare) :D

[mailing list]: http://groups.google.com/group/activeadmin
[Stack Overflow]: http://stackoverflow.com/questions/tagged/activeadmin
[search the issue tracker]: https://github.com/activeadmin/activeadmin/issues?q=something
[new issue]: https://github.com/activeadmin/activeadmin/issues/new
[fork Active Admin]: https://help.github.com/articles/fork-a-repo
[searching all issues]: https://github.com/activeadmin/activeadmin/issues?q=
[master template]: https://github.com/activeadmin/activeadmin/blob/master/lib/bug_report_templates/active_admin_master.rb
[codeclimate]: https://codeclimate.com
[codeclimate cli]: https://github.com/codeclimate/codeclimate
[make a pull request]: https://help.github.com/articles/creating-a-pull-request
[git rebasing]: http://git-scm.com/book/en/Git-Branching-Rebasing
[interactive rebase]: https://help.github.com/articles/interactive-rebase
