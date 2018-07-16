Package.describe({
  name: 'gdprStorage',
  version: '0.3.13',
  summary: 'gdprStorage package for Meteor',
  git: 'https://github.com/gerasev-kirill/angular-gdpr-storage',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0.1');
  api.use('urigo:angular@0.8.4', 'client');
  api.addFiles('dist/gdprStorage.js', 'client');
});
