/**
 * Initialize Servant SDK
 */

Servant.initialize({
    application_client_id: Theme.data.servant_client_id
});

/**
 * Set Defaults
 */

Theme.data.criteria = {
    query: {},
    sort: {
        created: -1
    },
    page: 2 // First page of posts is fetched server-side for SEO reasons
};
Theme.data.menu = false;
Theme.data.loading_products = false;
Theme.data.more_products = true;


$(document).ready(function() {

    Theme.initialize();

});

/**
 * Core Functions
 */

Theme.initialize = function() {

    // Defaults
    var _this = this;
    Theme.data.themes = Theme.data.themes.split(','); // These were added as one long string.  Convert to array.

    // Initialize Vendee Products
    if (!Theme.data.article_id) {

        // Listener: Window Scroll
        $(window).scroll(function() {
            var difference = $('#content').height() - $(window).scrollTop();
            if (difference < 1500) return _this.listProducts();
        });

    }

    // Initialize Popup
    if (Theme.data.popup && Theme.data.popup !== 'none') _this.initializePopup();

    // Initialize Admin 
    if (Theme.data.authenticated === 'true') _this.admin.initializeAdmin();

};


Theme.listProducts = function(callback) {
    var _this = this;

    // Check If More Products Are Available
    if (_this.data.loading_products || !_this.data.more_products) return;

    // Set Loading True
    _this.data.loading_products = true;
    $('.loading').show();

    // Query Servant
    Servant.queryArchetypes(Theme.data.access_token, Theme.data.servant_id, 'product', _this.data.criteria, function(error, response) {

        if (error) console.log(error);

        // Hide Loading Notice
        $('.loading').hide();

        // Render Each Product
        for (i = 0; i < response.records.length; i++) {
            _this.renderProduct(response.records[i])
        };

        // Increment Page
        _this.data.criteria.page = _this.data.criteria.page + 1;

        // Check If More Posts
        if (response.records.length < 10) _this.data.more_products = false;

        // Set Loading False
        setTimeout(function() {
            _this.data.loading_products = false;
        }, 1000);

        // Callback
        if (callback) return callback(response);

    });
};



Theme.renderProducts = function(post) {
    var _this = this;
    // Open Article Element
    var html = '<article class="post hentry format-standard" itemscope itemtype="http://schema.org/Article">';
    // Add Article Title
    html = html + '<header class="entry-header"><h1 class="entry-title" itemprop="name">'
    if (!Theme.data.custom_domain) html = html + '<a rel="bookmark" href="/articles/' + post._id + '">' + post.title + '</a>';
    else html = html + '<a rel="bookmark" href="/articles/' + post._id + '">' + post.title + '</a>';
    html = html + '</h1></header>';
    // Add Snippet
    var paragraphs = $(post.html).filter("p");
    if (paragraphs[0].innerHTML) var snippet = paragraphs[0].innerHTML;
    else if (paragraphs[1].innerHTML) var snippet = paragraphs[1].innerHTML;
    else if (paragraphs[2].innerHTML) var snippet = paragraphs[2].innerHTML;
    html = html + '<div class="entry-content"><p itemprop="description" itemprop="description">' + snippet + '</p></div>';
    // Close Article Element
    html = html + '</article>';
    // Apped HTML
    $('#main').append(html);
};

Theme.loadLogoImage = function(imageID) {

    var _this = this;

    if (!imageID) return;

    // Show Archetype
    Servant.showArchetype(Theme.data.access_token, Theme.data.servant_id, 'image', imageID, function(error, response) {

        $('.logo-image').attr('src', response.resolution_medium)
        $('.logo-image').show();

        if (Theme.data.authenticated) {
            $('#admin-logo-image').attr('src', response.resolution_medium);
            $('#admin-logo-image-container').show();
        }

    });
};


Theme.initializePopup = function() {
    var _this = this;

    // If popup is on a timer
    if (Theme.data.popup === 'timer') {

        // Add Animation Class
        $('#modal-popup').addClass('animate-zoom-in');

        // Set Timer
        setTimeout(function() {
            if (!_this.utilities.cookies.hasItem('sp_popup_' + _this.data.vendee_subdomain)) Theme.showModal('#modal-popup');
        }, Theme.data.popup_timer ? Theme.data.popup_timer * 1000 : 10000);

    }

    // If popup is on an exit event (i.e., mouse leaves document)
    if (Theme.data.popup === 'exit') {

        // Add Animation Class
        $('#modal-popup').addClass('animate-wobble');

        // Listener: Mouse Leave Document
        document.body.addEventListener('mouseleave', function() {
            if (!_this.utilities.cookies.hasItem('sp_popup_' + _this.data.vendee_subdomain)) Theme.showModal('#modal-popup');
        });

    }

    // Form Submission Handler
    $('#form-email').submit(function(event) {
        event.preventDefault();
        return Theme.savePopupEmail();
    });
};


Theme.savePopupEmail = function() {

    var _this = this;

    // Validate
    var email = $('#field-email').val();
    if (!email || !email.length) return;

    // Modify View
    $('#form-submit').hide();
    $('#form-saving').show();
    $('#form-hide').hide();

    var data = {
        subdomain: Theme.data.vendee_subdomain,
        email: email
    }

    $.ajax({
        url: "/api/popup/email",
        method: 'POST',
        data: data,
        dataType: 'json'
    }).fail(function(jqXHR, error) {
        $('#form-saving').hide();
        $('#form-error').text(jqXHR.responseJSON.message);
        $('#form-error').show();
        setTimeout(function() {
            $('#form-error').hide();
            $('#form-submit').show();
            $('#form-hide').show();
        }, 2000);
    }).done(function(response) {
        $('#form-saving').hide();
        $('#form-success').show();
        setTimeout(function() {
            return _this.hideModal('sp_popup_' + Theme.data.vendee_subdomain, 'seen', 604800);
        }, 1700);
    });
};


Theme.showModal = function(modalID) {
    $('#modal-background').show();
    $(modalID).show();
};


Theme.hideModal = function(cookieKey, cookieValue, cookieExpires) {
    var _this = this;

    $('.modal').hide();

    // If cookieKey is provided, set it
    if (cookieKey) {
        if (_this.utilities.cookies.getItem(cookieKey)) _this.utilities.cookies.removeItem(_this.utilities.cookies.getItem(cookieKey));
        _this.utilities.cookies.setItem(cookieKey, cookieValue, cookieExpires);
    }
};


// End