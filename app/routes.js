// Dependencies
var middleware = require('../app/controllers/middleware');
var application = require('../app/controllers/application');
var servant = require('../app/controllers/servant');

module.exports = function(app) {

    /**
     * Application Routes
     */

    app.get('/api/servant/callback', servant.servantConnectCallback, application.index);
    app.post('/api/servant/webhooks', servant.servantWebhooksCallback);
    app.post('/api/settings', application.saveSettings);
    app.post('/api/popup/email', application.saveEmail);
    app.get('/api/blog/servant/:servantID', application.loadBlogByServant);
    app.get('/api/logout', application.logOut);
    // Blog Routes
    app.get('/articles/:articleID', middleware.checkBlog, application.index);
    app.get('/articles', middleware.checkBlog, application.index);
    app.get('/', middleware.checkBlog, application.index);

};