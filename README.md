# Ink Deploy Pack

The Ink ember-cli-deploy pack is an opinionated collection of ember-cli-deploy plugins used to manage the deployment of Ember applications used at [Movable Ink](http://movableink.com).

It relies on Github, TravisCI, Slack, S3 for assets and Redis for revisions.

## Installation

```bash
ember install ember-cli-deploy-ink-pack
```

To update your `config/deploy.js` from the blueprints provided, invoke:

```bash
ember generate ink-deploy-config
```

## Deploying

To deploy to staging and production, you'll need to create a `.env.deploy.staging` and `.env.deploy.production` respectively.

These files require the following:

```
AWS_KEY=xxx
AWS_SECRET=xxx
AWS_BUCKET=xxx
REDIS_HOST=xxx
CLOUDFRONT_URL=xxx
SLACK_WEBHOOK=xxx
```

If you have any trouble, get in touch with a developer who has had their environment configured. They'll provide the bucket name and host, and setup an IAM account if needed.

We use `ember-cli-deploy` to deploy our assets. Provided is a short list that covers deployment of 99% of our use cases. For more information see [ember-cli/ember-cli-deploy](https://github.com/ember-cli/ember-cli-deploy).

```bash
ember deploy <environment> --activate
```

A successful activation will send a message to Slack. This is configurable by setting the `slack.message` property in `config/deploy.js`. Available variables are:

- `git.user.name`
- `git.user.email`
- `git.branch`
- `git.diff`
- `deploy.target`
- `deploy.duration`
- `package.name`
- `package.repository`
- `package.version`

### Previewing

To preview a change before activating, remove the `--activate` flag from `ember deploy`. A key will be returned that can be appended to the URL via ?revision=SHA before activating.

Revisions look like `<app-name>:c2f5951`, where `<app-name>` is the redis namespace and `c2f5951` is the git SHA of the last commit on that deploy.

To get a list of deployments, call `ember deploy:list <environment>`.

## Acknowledgements

This pack is heavily inspired by [ember-cli-deploy-zesty-pack](https://github.com/zestyzesty/ember-cli-deploy-zesty-pack) and [ember-cli-deploy-lightning-pack](https://github.com/ember-cli-deploy/ember-cli-deploy-lightning-pack).
