/**
 * Vendee Data Model
 */

var moment = require('moment'),
    crypto = require('crypto'),
    AWS = require('../other/instance_aws_sdk'),
    DOC = require('dynamodb-doc'),
    docClient = new DOC.DynamoDB();



var Vendee = {

    showVendee: function(key, callback) {

        var params = {
            TableName: 'servantvendee_vendees',
            Key: key
        };

        console.time('DynamoDB: ShowVendee');
        docClient.getItem(params, function(error, response) {
            console.timeEnd('DynamoDB: ShowVendee');
            return callback(error, response && response.Item ? response.Item : null);
        });

    },

    listVendeesByServant: function(servant_id, callback) {

        console.log(servant_id);

        var params = {};
        params.TableName = "servantvendee_vendees";
        params.IndexName = "servant_id-index";
        params.KeyConditions = [
            docClient.Condition("servant_id", "EQ", servant_id)
        ];

        // Using the query method because an index is set for this so the query operation searches only primary key attribute values fast (servant_id)
        docClient.query(params, function(error, response) {

            console.log(error, response);
            
            return callback(error, response && response.Items ? response.Items : []);
        });

    },

    listVendeesByUser: function(servant_user_id, callback) {

        var params = {};
        params.TableName = "servantvendee_vendees";
        params.IndexName = "servant_user_id-index";
        params.KeyConditions = [
            docClient.Condition("servant_user_id", "EQ", servant_user_id)
        ];

        // Using the query method because an index is set for this so the query operation searches only primary key attribute values fast (servant_user_id)
        docClient.query(params, function(error, response) {
            return callback(error, response && response.Items ? response.Items : []);
        });

    },

    listVendeesByCustomDomain: function(custom_domain, callback) {

        var params = {};
        params.TableName = "servantvendee_vendees";
        params.IndexName = "custom_domain-index";
        params.KeyConditions = [
            docClient.Condition("custom_domain", "EQ", custom_domain)
        ];

        // Using the query method because an index is set for this so the query operation searches only primary key attribute values fast (custom_domain)
        docClient.query(params, function(error, response) {
            return callback(error, response && response.Items ? response.Items : []);
        });

    },

    saveVendee: function(servant_vendee, callback) {

        var params = {
            TableName: 'servantvendee_vendees',
            ReturnValues: 'ALL_NEW',
            Key: {
                'subdomain': servant_vendee.subdomain
            },
            UpdateExpression: 'SET ',
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {}
        };

        // servant id
        if (servant_vendee.servant_id) {
            params.UpdateExpression = params.UpdateExpression + '#a = :servant_id_val';
            params.ExpressionAttributeNames['#a'] = 'servant_id';
            params.ExpressionAttributeValues[':servant_id_val'] = servant_vendee.servant_id;
        }
        // servant user id
        if (servant_vendee.servant_user_id) {
            params.UpdateExpression = params.UpdateExpression + ', #b = :servant_user_id_val';
            params.ExpressionAttributeNames['#b'] = 'servant_user_id';
            params.ExpressionAttributeValues[':servant_user_id_val'] = servant_vendee.servant_user_id;
        }
        // custom domain
        if (servant_vendee.custom_domain || servant_vendee.custom_domain === '') {
            params.UpdateExpression = params.UpdateExpression + ', #c = :custom_domain_val';
            params.ExpressionAttributeNames['#c'] = 'custom_domain';
            params.ExpressionAttributeValues[':custom_domain_val'] = servant_vendee.custom_domain.length ? servant_vendee.custom_domain : servant_vendee.subdomain + '.servantpress.io'; // Change this when domain changes
        }
        // vendee_title
        if (servant_vendee.vendee_title || servant_vendee.vendee_title === '') {
            params.UpdateExpression = params.UpdateExpression + ', #d = :vendee_title_val';
            params.ExpressionAttributeNames['#d'] = 'vendee_title';
            params.ExpressionAttributeValues[':vendee_title_val'] = servant_vendee.vendee_title.length ? servant_vendee.vendee_title : null;
        }
        // vendee_description
        if (servant_vendee.vendee_description || servant_vendee.vendee_description === '') {
            params.UpdateExpression = params.UpdateExpression + ', #e = :vendee_description_val';
            params.ExpressionAttributeNames['#e'] = 'vendee_description';
            params.ExpressionAttributeValues[':vendee_description_val'] = servant_vendee.vendee_description.length ? servant_vendee.vendee_description : null;
        }
        // vendee_keywords
        if (servant_vendee.vendee_keywords || servant_vendee.vendee_keywords === '') {
            params.UpdateExpression = params.UpdateExpression + ', #f = :vendee_keywords_val';
            params.ExpressionAttributeNames['#f'] = 'vendee_keywords';
            params.ExpressionAttributeValues[':vendee_keywords_val'] = servant_vendee.vendee_keywords.length ? servant_vendee.vendee_keywords.toLowerCase().replace(/[^\w\s,]/gi, '') : null;
        }
        // url_twitter
        if (servant_vendee.url_twitter || servant_vendee.url_twitter === '') {
            params.UpdateExpression = params.UpdateExpression + ', #g = :url_twitter_val';
            params.ExpressionAttributeNames['#g'] = 'url_twitter';
            params.ExpressionAttributeValues[':url_twitter_val'] = servant_vendee.url_twitter.length ? servant_vendee.url_twitter : null;
        }
        // url_facebook
        if (servant_vendee.url_facebook || servant_vendee.url_facebook === '') {
            params.UpdateExpression = params.UpdateExpression + ', #h = :url_facebook_val';
            params.ExpressionAttributeNames['#h'] = 'url_facebook';
            params.ExpressionAttributeValues[':url_facebook_val'] = servant_vendee.url_facebook.length ? servant_vendee.url_facebook : null;
        }
        // url_github
        if (servant_vendee.url_github || servant_vendee.url_github === '') {
            params.UpdateExpression = params.UpdateExpression + ', #i = :url_github_val';
            params.ExpressionAttributeNames['#i'] = 'url_github';
            params.ExpressionAttributeValues[':url_github_val'] = servant_vendee.url_github.length ? servant_vendee.url_github : null;
        }
        // popular_posts
        if (servant_vendee.popular_posts) {
            params.UpdateExpression = params.UpdateExpression + ', #j = :popular_posts_val';
            params.ExpressionAttributeNames['#j'] = 'popular_posts';
            params.ExpressionAttributeValues[':popular_posts_val'] = servant_vendee.popular_posts;
        }
        // theme
        if (servant_vendee.theme) {
            params.UpdateExpression = params.UpdateExpression + ', #k = :theme_val';
            params.ExpressionAttributeNames['#k'] = 'theme';
            params.ExpressionAttributeValues[':theme_val'] = servant_vendee.theme;
        }
        // theme_style
        if (servant_vendee.theme_style) {
            params.UpdateExpression = params.UpdateExpression + ', #l = :theme_style_val';
            params.ExpressionAttributeNames['#l'] = 'theme_style';
            params.ExpressionAttributeValues[':theme_style_val'] = servant_vendee.theme_style;
        }
        // url_home
        if (servant_vendee.url_home || servant_vendee.url_home === '') {
            params.UpdateExpression = params.UpdateExpression + ', #m = :url_home_val';
            params.ExpressionAttributeNames['#m'] = 'url_home';
            params.ExpressionAttributeValues[':url_home_val'] = servant_vendee.url_home.length ? servant_vendee.url_home : null;
        }
        // popup
        if (servant_vendee.popup || servant_vendee.popup === '') {
            params.UpdateExpression = params.UpdateExpression + ', #n = :popup_val';
            params.ExpressionAttributeNames['#n'] = 'popup';
            params.ExpressionAttributeValues[':popup_val'] = servant_vendee.popup.length ? servant_vendee.popup : null;
        }
        // popup_body
        if (servant_vendee.popup_body || servant_vendee.popup_body === '') {
            params.UpdateExpression = params.UpdateExpression + ', #o = :popup_body_val';
            params.ExpressionAttributeNames['#o'] = 'popup_body';
            params.ExpressionAttributeValues[':popup_body_val'] = servant_vendee.popup_body.length ? servant_vendee.popup_body : null;
        }
        // popup_header
        if (servant_vendee.popup_header || servant_vendee.popup_header === '') {
            params.UpdateExpression = params.UpdateExpression + ', #p = :popup_header_val';
            params.ExpressionAttributeNames['#p'] = 'popup_header';
            params.ExpressionAttributeValues[':popup_header_val'] = servant_vendee.popup_header.length ? servant_vendee.popup_header : null;
        }
        // popup_timer
        if (servant_vendee.popup_timer || servant_vendee.popup_timer === '') {
            params.UpdateExpression = params.UpdateExpression + ', #q = :popup_timer_val';
            params.ExpressionAttributeNames['#q'] = 'popup_timer';
            params.ExpressionAttributeValues[':popup_timer_val'] = servant_vendee.popup_timer.length ? servant_vendee.popup_timer : null;
        }
        // logo_image
        if (servant_vendee.logo_image || servant_vendee.logo_image === '') {
            params.UpdateExpression = params.UpdateExpression + ', #r = :logo_image_val';
            params.ExpressionAttributeNames['#r'] = 'logo_image';
            params.ExpressionAttributeValues[':logo_image_val'] = servant_vendee.logo_image.length ? servant_vendee.logo_image : null;
        }

        // Save DynamoDB Document
        console.time('DynamoDB: Save Vendee');
        docClient.updateItem(params, function(error, response) {
            console.timeEnd('DynamoDB: Save Vendee');
            return callback(error, response.Attributes);
        });

    }


};

module.exports = Vendee;