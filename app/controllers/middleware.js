// Dependencies
var Config = require('../../config/config'),
    HelpersApp = require('../other/helpers_app'),
    User = require('../models/user'),
    ServantBlog = require('../models/servant_blog');

/**
 * Middleware: Check Blog
 * - Detect Custom Domain, Subdomain
 */

module.exports.checkBlog = function(req, res, next) {

    // Defaults
    var blog_query = false;
    var domain = req.headers.host;
    var subdomain = domain.split('.');
    req.blog = false;

    /**
     * Check for custom domain or subdomain
     */

    var host = req.get('host').toLowerCase();

    if (host.indexOf('localhost:') === -1 &&
        host.indexOf('lvh.me:') === -1 &&
        host.indexOf('nitrousapp') === -1 &&
        host.indexOf('servant.press') === -1 &&
        host.indexOf('servantpress.io') === -1) {

        // This is a blog via custom domain, render...
        blog_query = {
            custom_domain: req.hostname
        };

    } else if (subdomain.length > 2 && subdomain[0] !== 'www' && subdomain[0] !== 'lvh' && subdomain[0] !== 'pro-env-bvfeuk8dpj') {

        // This is a blog via subdomain, render...
        blog_query = {
            subdomain: subdomain[0]
        };

    }

    /**
     * Load Blog & User or continue
     */

    if (blog_query && blog_query.subdomain) {

        // Load Blog
        ServantBlog.showServantBlog(blog_query, function(blog_error, blog) {

            if (!blog || blog_error) return HelpersApp.renderErrorPage(res, "This blog could not be found.");

            // Load Blog User, get access token
            User.showUser(blog.servant_user_id, function(user_error, user) {

                if (!user || user_error) return HelpersApp.renderErrorPage(res, "Sorry, something went wrong.");

                req.blog = blog;
                req.user = user;
                return next();

            });
        });

    } else if (blog_query && blog_query.custom_domain) {

        // Load Blog
        ServantBlog.listServantBlogsByCustomDomain(blog_query.custom_domain, function(blog_error, blogs) {

            if (!blogs.length || blog_error) return HelpersApp.renderErrorPage(res, "This blog could not be found.");

            // Load Blog User, get access token
            User.showUser(blogs[0].servant_user_id, function(user_error, user) {

                if (!user || user_error) return HelpersApp.renderErrorPage(res, "Sorry, something went wrong.");

                req.blog = blogs[0];
                req.user = user;
                return next();

            });
        });

    } else {

        return next();

    }

};