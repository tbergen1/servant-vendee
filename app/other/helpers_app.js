// Dependencies
var shortid = require('shortid'),
    Config = require('../../config/config'),
    SubdomainIncrementer = require('../models/subdomain_incrementer'),
    Vendee = require('../models/vendee');

/**
 * Create A Vendee
 */

var createVendee = function(servant, servantUserID, callback) {

    var new_vendee = {
        servant_id: servant._id,
        servant_user_id: servantUserID,
        vendee_title: servant.master && servant.master !== '' ? servant.master : 'An Untitled Vendee',
        vendee_description: servant.master_biography && servant.master_biography !== '' ? servant.master_biography : 'I don’t need an alarm clock. My ideas wake me.',
        popup: 'none',
        popup_header: 'Get Updates',
        popup_body: 'Have our updates delivered to your inbox.',
        theme: Config.app.themes[Math.floor(Math.random() * Config.app.themes.length)]
    };

    // Get unique subdomain
    SubdomainIncrementer.increment(function(error, result) {

        new_vendee.subdomain = (result.Attributes.number).toString(36);

        // In the rare case 'www' is generated as a subdomain, re-render this function
        if (new_vendee.subdomain === 'www') return createVendee(servant, servantUserID, callback);

        // Save new vendee
        Vendee.saveVendee(new_vendee, function(error, vendee) {
            if (error) return callback(error, null);
            return callback(null, vendee);
        });
    });

}

var renderErrorPage = function(res, error_message) {
    return res.render('error', {
        message: error_message,
        servant_client_id: process.env.SERVANT_CLIENT_ID,
        name: Config.app.name,
        description: Config.app.description,
        keywords: Config.app.keywords,
        environment: process.env.NODE_ENV,
        google_analytics_code: Config.google_analytics_code,
        fingerprint: Config.fingerprint
    });
};

module.exports = {
    createVendee: createVendee,
    renderErrorPage: renderErrorPage
};