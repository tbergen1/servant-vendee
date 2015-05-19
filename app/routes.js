// Dependencies
var middleware = require('../app/controllers/middleware');
var application = require('../app/controllers/application');
var servant = require('../app/controllers/servant');

module.exports = function(app) {

    /**
     * Application Routes
     */

    app.get('/api/servant/callback', servant.servantConnectCallback, application.index);
    app.post('/api/settings', application.saveSettings);
    app.post('/api/popup/email', application.saveEmail);
    app.get('/api/vendee/servant/:servantID', application.loadVendeeByServant);
    app.get('/api/logout', application.logOut);
    // Vendee Routes
    app.get('/products/:productID', middleware.checkVendee, application.index);
    app.get('/products', middleware.checkVendee, application.index);
    app.get('/', middleware.checkVendee, application.index);

};