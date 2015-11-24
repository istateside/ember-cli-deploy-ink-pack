/* jshint node: true */
'use strict';

function env(name) {
  if (process.env[name]) {
    return process.env[name];
  } else {
    throw new Error('Expected environment variable `' + name + '` to be set but it was not.');
  }
}

module.exports = function (deployTarget) {
  if (deployTarget === 'development') {
    return {
      'build': { environment: 'development' },
      'plugins': ['build', 'redis', 'display-revisions', 'revision-data']
    };
  }

  var ENV = {
    'build': { environment: 'production' },

    'package': require('../package.json'),

    'slack': {
      webhook: env('SLACK_WEBHOOK'),
      message: '{git.user.name} deployed {package.name}/{git.branch} to {deploy.target} (took {deploy.duration}s)\n' +
               '{package.repository}/compare/{git.diff}'
    },

    'revision-data': {
      type: 'git-commit'
    },

    'redis': {
      allowOverwrite: true,
      keyPrefix: '<%= dasherizedPackageName %>'
    },

    'ssh-tunnel': {
      username: 'deploy',
      host: env('REDIS_HOST'),
      privateKeyPath: null
    },

    's3': {
      accessKeyId: env('AWS_KEY'),
      secretAccessKey: env('AWS_SECRET'),
      bucket: env('AWS_BUCKET')
    }
  };

  return ENV;
};
