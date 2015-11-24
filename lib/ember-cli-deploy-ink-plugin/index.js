/* jshint node: true */
'use strict';

var Slack = require('node-slackr');
var RSVP = require('rsvp');

function exec(command) {
  var _exec = require('child_process').exec;
  return new RSVP.Promise(function (resolve, reject) {
    _exec(command, function (error, stdout, stderror) {
      if (error == null) {
        resolve(stdout.trim());
      } else {
        reject(stderror);
      }
    });
  });
}

function env(name) {
  if (process.env[name]) {
    return process.env[name];
  } else {
    throw new Error('Expected environment variable `' + name + '` to be set but it was not.');
  }
}

module.exports = {
  name: 'ember-cli-deploy-ink-plugin',

  createDeployPlugin: function () {
    return {
      name: 'ink',

      setup: function (context) {
        var config = context.config;
        if (config.build.environment !== 'development') {
          config.redis.url = 'redis://127.0.0.1:' + context.tunnel.srcPort + '/';
        }
      },

      willDeploy: function (context) {
        var buildContext = process.env['TRAVIS'] ? this.buildCiContext(context) : this.buildContext(context);
        return RSVP.hash(buildContext).then(function (ctx) {
          context.config.slack.context = ctx;
          context.config.slack.buildStart = new Date();
        });
      },

      willActivate: function (context) {
        // We've already setup the message context if it's a deploy
        if (context.config.slack.context) {
          return;
        }

        var buildContext = process.env['TRAVIS'] ? this.buildCiContext(context) : this.buildContext(context);
        return RSVP.hash(buildContext).then(function (ctx) {
          context.config.slack.context = ctx;
          context.config.slack.buildStart = new Date();
        });
      },

      didActivate: function (context) {
        var config = context.config.slack;
        var slack = new Slack(config.webhook, {
          channel: config.channel,
          username: config.username
        });

        config.context['deploy.duration'] = (new Date() - config.buildStart) / 1000;

        return this.buildMessage(config.message, config.context).then(function (message) {
          console.log(message);
          return new RSVP.Promise(function (resolve, reject) {
            slack.notify(message, function (error, result) {
              if (error) { return reject(error); }
              return resolve(result);
            });
          });
        });
      },

      buildCiContext: function (context) {
        return {
          'git.user.name': 'Travis',
          'git.user.email': '',
          'git.branch': env('TRAVIS_BRANCH'),
          'git.diff': env('TRAVIS_COMMIT_RANGE'),
          'deploy.target': context.deployTarget,
          'package.name': context.config.package.name,
          'package.repository': context.config.package.repository,
          'package.version': context.config.package.version
        };
      },

      buildContext: function (context) {
        return {
          'git.user.name': exec('git config --get user.name'),
          'git.user.email': exec('git config --get user.email'),
          'git.branch': exec('git rev-parse --abbrev-ref HEAD'),
          'git.diff': function () {
            return RSVP.all([
              exec('ember deploy:list ' + context.deployTarget).then(function (list) {
                var active = list.split("\n").filter(function (line) {
                  return line.replace('-', '').trim().indexOf('>') === 0;
                })[0] || 'HEAD';

                return active.replace('-', '').replace('>', '').trim();
              }),
              exec('git rev-parse --short HEAD')
            ]).then(function (results) {
              return results.join('...');
            });
          }(),
          'deploy.target': context.deployTarget,
          'package.name': context.config.package.name,
          'package.repository': context.config.package.repository,
          'package.version': context.config.package.version
        };
      },

      buildMessage: function (format, context) {
        var config = {};

        format.match(/{([^}]*)}/g).forEach(function (path) {
          path = path.slice(1, -1);
          if (!config[path]) {
            var value = context[path];
            if (value.apply) {
              value = value();
            }
            config[path] = value;
          }
        });

        return RSVP.hash(config).then(function (config) {
          var message = format.replace(/{([^}]*)}/g, function (_, path) {
            return config[path];
          });

          return {
            fallback: message,
            attachments: [{
              color: '#E1563F',
              text: message
            }]
          };
        });
      }
    };
  }
};
