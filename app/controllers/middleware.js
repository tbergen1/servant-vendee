// Dependencies
var Config = require('../../config/config'),
    HelpersApp = require('../other/helpers_app'),
    User = require('../models/user'),
    Vendee = require('../models/vendee');

/**
 * Middleware: Check Vendee
 * - Detect Custom Domain, Subdomain
 */

module.exports.checkVendee = function(req, res, next) {

    // Defaults
    var vendee_query = false;
    var domain = req.headers.host;
    var subdomain = domain.split('.');
    req.vendee = false;

    /**
     * Check for custom domain or subdomain
     */

    var host = req.get('host').toLowerCase();

    if (host.indexOf('localhost:') === -1 &&
        host.indexOf('lvh.me:') === -1 &&
        host.indexOf('nitrousapp') === -1 &&
        host.indexOf('servant.press') === -1 &&
        host.indexOf('servantpress.io') === -1) {

        // This is a vendee via custom domain, render...
        vendee_query = {
            custom_domain: req.hostname
        };

    } else if (subdomain.length > 2 && subdomain[0] !== 'www' && subdomain[0] !== 'lvh' && subdomain[0] !== 'pro-env-bvfeuk8dpj') {

        // This is a vendee via subdomain, render...
        vendee_query = {
            subdomain: subdomain[0]
        };

    }

    /**
     * Load Vendee & User or continue
     */

    if (vendee_query && vendee_query.subdomain) {

        // Load Vendee
        Vendee.showVendee(vendee_query, function(vendee_error, vendee) {

            if (!vendee || vendee_error) return HelpersApp.renderErrorPage(res, "This vendee could not be found.");

            // Load Vendee User, get access token
            User.showUser(vendee.servant_user_id, function(user_error, user) {

                if (!user || user_error) return HelpersApp.renderErrorPage(res, "Sorry, something went wrong.");

                req.vendee = vendee;
                req.user = user;
                return next();

            });
        });

    } else if (vendee_query && vendee_query.custom_domain) {

        // Load Vendee
        Vendee.listVendeesByCustomDomain(vendee_query.custom_domain, function(vendee_error, vendees) {

            if (!vendees.length || vendee_error) return HelpersApp.renderErrorPage(res, "This vendee could not be found.");

            // Load Vendee User, get access token
            User.showUser(vendees[0].servant_user_id, function(user_error, user) {

                if (!user || user_error) return HelpersApp.renderErrorPage(res, "Sorry, something went wrong.");

                req.vendee = vendees[0];
                req.user = user;
                return next();

            });
        });

    } else {

        return next();

    }

};