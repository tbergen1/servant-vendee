/**
 * ServantShowcase Data Model
 */

var moment = require('moment'),
    crypto = require('crypto'),
    AWS = require('../other/instance_aws_sdk'),
    DOC = require('dynamodb-doc'),
    docClient = new DOC.DynamoDB();



var ServantShowcase = {

    showServantBlog: function(key, callback) {

        var params = {
            TableName: 'servantpress_servantblogs',
            Key: key
        };

        console.time('DynamoDB: ShowServantBlog');
        docClient.getItem(params, function(error, response) {
            console.timeEnd('DynamoDB: ShowServantBlog');
            return callback(error, response && response.Item ? response.Item : null);
        });

    },

    listServantBlogsByServant: function(servant_id, callback) {

        var params = {};
        params.TableName = "servantpress_servantblogs";
        params.IndexName = "servant_id-index";
        params.KeyConditions = [
            docClient.Condition("servant_id", "EQ", servant_id)
        ];

        // Using the query method because an index is set for this so the query operation searches only primary key attribute values fast (servant_id)
        docClient.query(params, function(error, response) {
            return callback(error, response && response.Items ? response.Items : []);
        });

    },

    listServantBlogsByUser: function(servant_user_id, callback) {

        var params = {};
        params.TableName = "servantpress_servantblogs";
        params.IndexName = "servant_user_id-index";
        params.KeyConditions = [
            docClient.Condition("servant_user_id", "EQ", servant_user_id)
        ];

        // Using the query method because an index is set for this so the query operation searches only primary key attribute values fast (servant_user_id)
        docClient.query(params, function(error, response) {
            return callback(error, response && response.Items ? response.Items : []);
        });

    },

    listServantBlogsByCustomDomain: function(custom_domain, callback) {

        var params = {};
        params.TableName = "servantpress_servantblogs";
        params.IndexName = "custom_domain-index";
        params.KeyConditions = [
            docClient.Condition("custom_domain", "EQ", custom_domain)
        ];

        // Using the query method because an index is set for this so the query operation searches only primary key attribute values fast (custom_domain)
        docClient.query(params, function(error, response) {
            return callback(error, response && response.Items ? response.Items : []);
        });

    },

    saveServantBlog: function(servant_blog, callback) {

        var params = {
            TableName: 'servantpress_servantblogs',
            ReturnValues: 'ALL_NEW',
            Key: {
                'subdomain': servant_blog.subdomain
            },
            UpdateExpression: 'SET ',
            ExpressionAttributeNames: {},
            ExpressionAttributeValues: {}
        };

        // servant id
        if (servant_blog.servant_id) {
            params.UpdateExpression = params.UpdateExpression + '#a = :servant_id_val';
            params.ExpressionAttributeNames['#a'] = 'servant_id';
            params.ExpressionAttributeValues[':servant_id_val'] = servant_blog.servant_id;
        }
        // servant user id
        if (servant_blog.servant_user_id) {
            params.UpdateExpression = params.UpdateExpression + ', #b = :servant_user_id_val';
            params.ExpressionAttributeNames['#b'] = 'servant_user_id';
            params.ExpressionAttributeValues[':servant_user_id_val'] = servant_blog.servant_user_id;
        }
        // custom domain
        if (servant_blog.custom_domain || servant_blog.custom_domain === '') {
            params.UpdateExpression = params.UpdateExpression + ', #c = :custom_domain_val';
            params.ExpressionAttributeNames['#c'] = 'custom_domain';
            params.ExpressionAttributeValues[':custom_domain_val'] = servant_blog.custom_domain.length ? servant_blog.custom_domain : servant_blog.subdomain + '.servantpress.io'; // Change this when domain changes
        }
        // blog_title
        if (servant_blog.blog_title || servant_blog.blog_title === '') {
            params.UpdateExpression = params.UpdateExpression + ', #d = :blog_title_val';
            params.ExpressionAttributeNames['#d'] = 'blog_title';
            params.ExpressionAttributeValues[':blog_title_val'] = servant_blog.blog_title.length ? servant_blog.blog_title : null;
        }
        // blog_description
        if (servant_blog.blog_description || servant_blog.blog_description === '') {
            params.UpdateExpression = params.UpdateExpression + ', #e = :blog_description_val';
            params.ExpressionAttributeNames['#e'] = 'blog_description';
            params.ExpressionAttributeValues[':blog_description_val'] = servant_blog.blog_description.length ? servant_blog.blog_description : null;
        }
        // blog_keywords
        if (servant_blog.blog_keywords || servant_blog.blog_keywords === '') {
            params.UpdateExpression = params.UpdateExpression + ', #f = :blog_keywords_val';
            params.ExpressionAttributeNames['#f'] = 'blog_keywords';
            params.ExpressionAttributeValues[':blog_keywords_val'] = servant_blog.blog_keywords.length ? servant_blog.blog_keywords.toLowerCase().replace(/[^\w\s,]/gi, '') : null;
        }
        // url_twitter
        if (servant_blog.url_twitter || servant_blog.url_twitter === '') {
            params.UpdateExpression = params.UpdateExpression + ', #g = :url_twitter_val';
            params.ExpressionAttributeNames['#g'] = 'url_twitter';
            params.ExpressionAttributeValues[':url_twitter_val'] = servant_blog.url_twitter.length ? servant_blog.url_twitter : null;
        }
        // url_facebook
        if (servant_blog.url_facebook || servant_blog.url_facebook === '') {
            params.UpdateExpression = params.UpdateExpression + ', #h = :url_facebook_val';
            params.ExpressionAttributeNames['#h'] = 'url_facebook';
            params.ExpressionAttributeValues[':url_facebook_val'] = servant_blog.url_facebook.length ? servant_blog.url_facebook : null;
        }
        // url_github
        if (servant_blog.url_github || servant_blog.url_github === '') {
            params.UpdateExpression = params.UpdateExpression + ', #i = :url_github_val';
            params.ExpressionAttributeNames['#i'] = 'url_github';
            params.ExpressionAttributeValues[':url_github_val'] = servant_blog.url_github.length ? servant_blog.url_github : null;
        }
        // popular_posts
        if (servant_blog.popular_posts) {
            params.UpdateExpression = params.UpdateExpression + ', #j = :popular_posts_val';
            params.ExpressionAttributeNames['#j'] = 'popular_posts';
            params.ExpressionAttributeValues[':popular_posts_val'] = servant_blog.popular_posts;
        }
        // theme
        if (servant_blog.theme) {
            params.UpdateExpression = params.UpdateExpression + ', #k = :theme_val';
            params.ExpressionAttributeNames['#k'] = 'theme';
            params.ExpressionAttributeValues[':theme_val'] = servant_blog.theme;
        }
        // theme_style
        if (servant_blog.theme_style) {
            params.UpdateExpression = params.UpdateExpression + ', #l = :theme_style_val';
            params.ExpressionAttributeNames['#l'] = 'theme_style';
            params.ExpressionAttributeValues[':theme_style_val'] = servant_blog.theme_style;
        }
        // url_home
        if (servant_blog.url_home || servant_blog.url_home === '') {
            params.UpdateExpression = params.UpdateExpression + ', #m = :url_home_val';
            params.ExpressionAttributeNames['#m'] = 'url_home';
            params.ExpressionAttributeValues[':url_home_val'] = servant_blog.url_home.length ? servant_blog.url_home : null;
        }
        // popup
        if (servant_blog.popup || servant_blog.popup === '') {
            params.UpdateExpression = params.UpdateExpression + ', #n = :popup_val';
            params.ExpressionAttributeNames['#n'] = 'popup';
            params.ExpressionAttributeValues[':popup_val'] = servant_blog.popup.length ? servant_blog.popup : null;
        }
        // popup_body
        if (servant_blog.popup_body || servant_blog.popup_body === '') {
            params.UpdateExpression = params.UpdateExpression + ', #o = :popup_body_val';
            params.ExpressionAttributeNames['#o'] = 'popup_body';
            params.ExpressionAttributeValues[':popup_body_val'] = servant_blog.popup_body.length ? servant_blog.popup_body : null;
        }
        // popup_header
        if (servant_blog.popup_header || servant_blog.popup_header === '') {
            params.UpdateExpression = params.UpdateExpression + ', #p = :popup_header_val';
            params.ExpressionAttributeNames['#p'] = 'popup_header';
            params.ExpressionAttributeValues[':popup_header_val'] = servant_blog.popup_header.length ? servant_blog.popup_header : null;
        }
        // popup_timer
        if (servant_blog.popup_timer || servant_blog.popup_timer === '') {
            params.UpdateExpression = params.UpdateExpression + ', #q = :popup_timer_val';
            params.ExpressionAttributeNames['#q'] = 'popup_timer';
            params.ExpressionAttributeValues[':popup_timer_val'] = servant_blog.popup_timer.length ? servant_blog.popup_timer : null;
        }
        // logo_image
        if (servant_blog.logo_image || servant_blog.logo_image === '') {
            params.UpdateExpression = params.UpdateExpression + ', #r = :logo_image_val';
            params.ExpressionAttributeNames['#r'] = 'logo_image';
            params.ExpressionAttributeValues[':logo_image_val'] = servant_blog.logo_image.length ? servant_blog.logo_image : null;
        }

        // Save DynamoDB Document
        console.time('DynamoDB: Save ServantBlog');
        docClient.updateItem(params, function(error, response) {
            console.timeEnd('DynamoDB: Save ServantBlog');
            return callback(error, response.Attributes);
        });

    }


};

module.exports = ServantBlog;