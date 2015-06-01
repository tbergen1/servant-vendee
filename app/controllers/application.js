// Dependencies & Defaults
var async = require('async'),
    moment = require('moment'),
    _ = require('lodash'),
    Vendee = require('../models/vendee'),
    User = require('../models/user'),
    ServantSDK = require('../other/instance_servant_sdk'),
    HelpersApp = require('../other/helpers_app'),
    Config = require('../../config/config');

/**
 * Index
 * - Middleware first checks the URL to see if it is a vendee's URL via subdomain or custom domain
 * - Renders either the home page, vendee or a random vendee owned by the user
 */

var index = function(req, res) {


    // Define Site Variables
    var site_variables = {
        servant_client_id: process.env.SERVANT_CLIENT_ID,
        name: Config.app.name,
        description: Config.app.description,
        keywords: Config.app.keywords,
        environment: process.env.NODE_ENV,
        google_analytics_code: Config.google_analytics_code,
        fingerprint: Config.fingerprint
    };


    // Scenario: No vendee and no session, render home page
    if (!req.vendee && !req.session.user) return res.render('home', site_variables);


    // Define vendee Variables
    var vendee_variables = {
        environment: process.env.NODE_ENV,
        fingerprint: Config.fingerprint,
        servant_client_id: process.env.SERVANT_CLIENT_ID,
        themes: Config.app.themes,

        authenticated: null,
        vendee: req.vendee ? req.vendee : {},
        user: req.user ? req.user : {},
        product_id: req.params.productID ? req.params.productID : null
    };
    // If vendee, session and vendee is owned by user session, mark authenticated
    if (req.vendee && req.session.user && req.vendee.servant_user_id === req.session.user.servant_user_id) vendee_variables.authenticated = true;

    // Scenario: No vendee but session, render random vendee owned by the session user
    if (!req.vendee && req.session.user) {
        return Vendee.listVendeesByUser(req.session.user.servant_user_id, function(error, vendees) {
            if (error) return res.status(500).json({
                error: error
            });
            // Redirect to random vendee
            var host = process.env.NODE_ENV === 'production' ? 'servantpress.io' : 'lvh.me:' + Config.app.port;
            res.redirect(req.protocol + '://' + vendees[0].subdomain + '.' + host);
        });
    }

    /**
     * Function Render Vendee
     * - Fetches first posts, single post and logo from the ServantAPI and renders it in the page for SEO reasons
     */

    var renderVendee = function() {

        vendee_variables.preload = {};

        // Define ServantAPI functions
        var getPosts = function(done) {
            ServantSDK.archetypesRecent(req.user.servant_access_token_limited, req.vendee.servant_id, 'product', 1, function(error, response) {
                if (error) vendee_variables.preload.error = error;
                else vendee_variables.preload.posts = response.records;
                return done();
            });
        };
        var getPost = function(done) {
            ServantSDK.showArchetype(req.user.servant_access_token_limited, req.vendee.servant_id, 'product', vendee_variables.product_id, function(error, response) {
                if (error) vendee_variables.preload.error = error;
                else vendee_variables.preload.post = response;
                return done();
            });
        };
        var getLogo = function(done) {
            ServantSDK.showArchetype(req.user.servant_access_token_limited, req.vendee.servant_id, 'image', vendee_variables.vendee.logo_image, function(error, response) {
                if (error) vendee_variables.preload.error = error;
                else vendee_variables.preload.logo = response;
                return done();
            });
        };

        var tasks = [];

        if (!vendee_variables.product_id) tasks.push(getPosts);
        if (vendee_variables.product_id) tasks.push(getPost);
        if (vendee_variables.vendee.logo_image) tasks.push(getLogo);

        console.time('ServantAPI: Calls');
        async.parallel(tasks, function(error, result) {
            console.log('HERERERERE')
            console.timeEnd('ServantAPI: Calls');
            res.render('vendee/vendee', vendee_variables);
        });

    };

    // Scenario: Render Vendee
    return renderVendee();

};



/**
 * Load Vendee By Servant
 * - Loads a vendee by servant id
 * - Used when a logged in user switches servant in the Admin Menu
 * - Creates a vendee, if servant doesn't have one
 */

var loadVendeeByServant = function(req, res, next) {

    // Defaults
    var host = process.env.NODE_ENV === 'production' ? 'servantpress.io' : 'lvh.me:' + Config.port;

    Vendee.listVendeesByServant(req.params.servantID, function(error, vendees) {

        if (error) return res.status(500).json({
            error: error
        });

        // Servant has vendee, redirect
        if (vendees && vendees.length) return res.redirect(req.protocol + '://' + vendees[0].subdomain + '.' + host);

        // Servant doesn't have vendee, create one
        ServantSDK.showServant(req.session.user.servant_access_token_limited, req.params.servantID, function(error, response) {

            if (error) return res.status(500).json({
                message: 'Servant not found or does not have permission to this application',
                error: error
            });

            HelpersApp.createVendee(response, req.session.user.servant_user_id, function(error, vendee) {

                if (error) return res.status(500).json({
                    error: error
                });

                // Render
                var host = process.env.NODE_ENV === 'production' ? 'servantpress.io' : 'lvh.me:' + Config.port;
                res.redirect(req.protocol + '://' + vendee.subdomain + '.' + host);

            });
        });

    });

};



/**
 * Save Settings
 * - Saves Vendee settings
 */

var saveSettings = function(req, res, next) {

    console.log(req.body)

    // Show Vendee
    Vendee.showVendee({
        subdomain: req.body.subdomain
    }, function(error, vendee) {

        if (error) return res.status(500).json({
            error: error
        });

        if (!vendee) return res.status(404).json({
            message: 'Vendee not found'
        });

        // Check if user owns this vendee
        if (vendee.servant_user_id !== req.session.user.servant_user_id) return res.status(401).json({
            message: 'Unauthorized'
        });

        _.assign(vendee, req.body);

        Vendee.saveVendee(vendee, function(error, vendee) {
            if (error) return res.status(500).json({
                error: error
            });
            return res.json(vendee);
        });
    });

};



/**
 * Save Email
 * - Save email address to user's servant
 */

var saveEmail = function(req, res, next) {

    /**
     * Validate
     */

    if (!req.body || !req.body.subdomain || !req.body.email) return res.status(400).json({
        message: 'Sorry, you are missing some required parameters'
    });
    if (req.body.email.indexOf('@') === -1 || req.body.email.indexOf('.') === -1) return res.status(400).json({
        message: 'This email looks invalid. Try again...'
    });

    /**
     * Define Save Contact Function
     */

    var saveContact = function(access_token, servant_id, tag) {

        // Check if contact with this email already exists in this servant
        ServantSDK.queryArchetypes(access_token, servant_id, 'contact', {
            query: {
                "email_addresses.email_address": req.body.email
            }
        }, function(error, response) {

            if (error) return res.status(400).json({
                message: 'Sorry, something went wrong'
            });

            if (!response.records.length) {

                // Contact doesn't exist, create one
                ServantSDK.saveArchetype(access_token, servant_id, 'contact', {
                    email_addresses: [{
                        email_address: req.body.email
                    }],
                    tags: [tag._id]
                }, function(error, response) {

                    if (error) return res.status(400).json({
                        message: 'Sorry, something went wrong'
                    });

                    return res.json({
                        message: 'Email successfully saved!'
                    });

                });

            } else {

                // Contact exists, ensure it has tag
                var active_tag = false;
                var inactive_tag = false;
                for (i = 0; i < response.records[0].tags.length; i++) {
                    if (response.records[0].tags[i].tag === 'email-marketing-active') active_tag = true;
                    if (response.records[0].tags[i].tag === 'email-marketing-inactive') response.records[0].tags.splice(i, 1);
                }

                if (!active_tag) {
                    if (!response.records[0].tags || !response.records[0].tags.length) response.records[0].tags = [];
                    response.records[0].tags.push(tag._id);
                }

                // Save Archetype
                ServantSDK.saveArchetype(access_token, servant_id, 'contact', response.records[0], function(error, response) {

                    if (error) return res.status(400).json({
                        message: 'Sorry, something went wrong'
                    });

                    return res.json({
                        message: 'Email successfully saved!'
                    });

                });
            }
        });
    };

    /**
     * Load Required Data
     */

    Vendee.showVendee({
        subdomain: req.body.subdomain
    }, function(error, vendee) {

        if (error || !vendee) return res.status(400).json({
            message: 'Sorry, something went wrong'
        });

        // Load user, to get Servant access token
        User.showUser(vendee.servant_user_id, function(error, user) {

            if (error || !user) return res.status(400).json({
                message: 'Sorry, something went wrong'
            });

            // Search for tag entitled: 'email-marketing-active
            var criteria = {
                query: {
                    '$text': {
                        '$search': 'email-marketing-active'
                    }
                },
                sort: {},
                page: 1
            };
            ServantSDK.queryArchetypes(user.servant_access_token, vendee.servant_id, 'tag', criteria, function(error, response) {

                if (error) return res.status(400).json({
                    message: 'Sorry, something went wrong'
                });

                if (response.records.length) {
                    for (i = 0; i < response.records.length; i++) {
                        if (response.records[i].tag === 'email-marketing-active') var tag = response.records[i];

                    }
                }

                // If tag was found, save contact
                if (tag) return saveContact(user.servant_access_token, vendee.servant_id, tag);

                // Otherwise, Create tag
                ServantSDK.saveArchetype(user.servant_access_token, vendee.servant_id, 'tag', {
                    tag: 'email-marketing-active'
                }, function(error, response) {

                    if (error) return res.status(400).json({
                        message: 'Sorry, something went wrong'
                    });

                    return saveContact(user.servant_access_token, vendee.servant_id, response);

                });
            });
        });
    });
};


/**
 * Log Out
 * - Destroy session, then redirect to home page
 */

var logOut = function(req, res, next) {

    req.session = null;
    return res.redirect('/');

};



module.exports = {
    index: index,
    loadVendeeByServant: loadVendeeByServant,
    saveSettings: saveSettings,
    saveEmail: saveEmail,
    logOut: logOut
};
