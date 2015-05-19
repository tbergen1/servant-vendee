// Dependencies
var shortid = require('shortid'),
    Config = require('../../config/config'),
    SubdomainIncrementer = require('../models/subdomain_incrementer'),
    ServantBlog = require('../models/servant_blog');

/**
 * Create A Servant Blog
 */

var createServantBlog = function(servant, servantUserID, callback) {

    var new_blog = {
        servant_id: servant._id,
        servant_user_id: servantUserID,
        blog_title: servant.master && servant.master !== '' ? servant.master : 'An Untitled Blog',
        blog_description: servant.master_biography && servant.master_biography !== '' ? servant.master_biography : 'I don’t need an alarm clock. My ideas wake me.',
        popup: 'none',
        popup_header: 'Get Updates',
        popup_body: 'Have our updates delivered to your inbox.',
        theme: Config.app.themes[Math.floor(Math.random() * Config.app.themes.length)]
    };

    // Get unique subdomain
    SubdomainIncrementer.increment(function(error, result) {

        new_blog.subdomain = (result.Attributes.number).toString(36);

        // In the rare case 'www' is generated as a subdomain, re-render this function
        if (new_blog.subdomain === 'www') return createServantBlog(servant, servantUserID, callback);

        // Save new blog
        ServantBlog.saveServantBlog(new_blog, function(error, blog) {
            if (error) return callback(error, null);
            return callback(null, blog);
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
    createServantBlog: createServantBlog,
    renderErrorPage: renderErrorPage
};