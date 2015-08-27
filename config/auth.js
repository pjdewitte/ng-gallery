
var config = require('./config-server');

var auth = {

    'facebookAuth': {
        'clientID': '',
        'clientSecret': '',
        'callbackURL': 'http://localhost:3000' + config.host + '/api/auth/facebook/callback'
    },

    'googleAuth': {
        'clientID': '',
        'clientSecret': '',
        'callbackURL': 'http://localhost:3000' + config.host + '/api/auth/google/callback'
    },

    'githubAuth': {
        'clientID': '',
        'clientSecret': '',
        'callbackURL': 'http://localhost:3000' + config.host + '/api/auth/github/callback'
    },

    'linkedInAuth': {
        'clientID': '',
        'clientSecret': '',
        'callbackURL': 'http://localhost:3000' + config.host + '/api/auth/linkedin/callback'
    }
};

module.exports = local;