// Dependencies
var async = require('async'),
    moment = require('moment'),
    shortid = require('shortid'),
    HelpersApp = require('../other/helpers_app'),
    Users = require('../models/user'),
    Vendee = require('../models/vendee'),
    Config = require('../../config/config'),
    ServantSDK = require('../other/instance_servant_sdk');

/**
 * Servant Connect Callback
 * - Creates Access Token from Auth Code, if necessary
 */


var servantConnectCallback = function(req, res, next) {

    var _this = this;

    _this.processUserAndServants = function(tokens) {

        ServantSDK.getUserAndServants(tokens.access_token, function(error, response) {

            if (error) return res.status(500).json({
                error: error
            });

            /**
             * Create/Update User
             */

            var user = {};
            // Save Tokens
            user.servant_access_token = tokens.access_token;
            user.servant_access_token_limited = tokens.access_token_limited;
            user.servant_refresh_token = tokens.refresh_token;
            // Save User information
            user.servant_user_id = response.user._id;
            user.full_name = response.user.full_name;
            user.nick_name = response.user.nick_name;
            user.email = response.user.email;
            user.last_signed_in = moment().format('X');
            Users.saveUser(user, function(error, data) {

                if (error) return res.status(500).json({
                    error: error
                });

                console.log(error, data);

                /**
                 * Render Vendee of User's first Servant
                 */

                // TODO:  If User has not authorized any Servants, render error page via the HelpersApp.renderErrorPage()

                Vendee.listVendeesByServant(response.servants[0]._id, function(error, vendees) {

                    console.log(error, vendees);

                    if (error) return res.status(500).json({
                        error: error
                    });

                    // Servant has vendee, render it
                    if (vendees && vendees.length) {

                        // Create User Session
                        req.session = {
                            user: user
                        };

                        return res.redirect('/');
                    }

                    // Servant doesn't have a vendee, create one
                    HelpersApp.createVendee(response.servants[0], user.servant_user_id, function(error, vendee) {

                        console.log(error, vendee)

                        if (error) return res.status(500).json({
                            error: error
                        });

                        // Create User Session
                        req.session = {
                            user: user
                        };

                        // Render
                        return res.redirect('/');

                    });
                });
            });
        });
    }

    /**
     * Handle Callback accordingly
     */

    if (req.query.code) {
        ServantSDK.exchangeAuthCode(req.query.code, function(error, servant_tokens) {
            if (error) return res.status(500).json({
                error: error
            });
            return _this.processUserAndServants(servant_tokens);
        });
    } else {
        return _this.processUserAndServants(req.query);
    }

};

// Servant Webhooks Callback
var servantWebhooksCallback = function(req, res) {
    console.log("Servant Webhook Received: ", req.body);
    // Always respond to Servant with status 200
    res.json({
        status: 'Webhook Received'
    });
};


module.exports = {
    servantConnectCallback: servantConnectCallback,
    servantWebhooksCallback: servantWebhooksCallback
};