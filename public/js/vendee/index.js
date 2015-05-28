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

Theme.data.oldIndex = 0;
Theme.data.swipeCount = 0;
Theme.data.currentPosition = 0;


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



    //Initialize Slick.js
    Theme.data.slider = $('#products-container');
    Theme.data.slider.slick({
        nextArrow: $('#next-product'),
        prevArrow: $('#prev-product')
    });

    $("#showcase-slider-container").show();

    //Monitor swipe position and add products
    Theme.data.slider.on('afterChange', function(event, slick, currentSlide) {
        Theme.data.currentPosition = currentSlide;
        Theme._extendProducts(slick, currentSlide);
    });

    // Initialize Popup
    if (Theme.data.popup && Theme.data.popup !== 'none') _this.initializePopup();

    // Initialize Admin 
    if (Theme.data.authenticated === 'true') _this.admin.initializeAdmin();

};


Theme.listProducts = function(callback) {
    var _this = this;

    // Check If More Products Are Available
    if (_this.data.loading_products || !_this.data.more_products) return;

    // Query Servant
    Servant.queryArchetypes(Theme.data.access_token, Theme.data.servant_id, 'product', _this.data.criteria, function(error, response) {

        if (error) console.log(error);

        // Render Each Product
        for (i = 0; i < response.records.length; i++) {
            _this.renderProducts(response.records[i])
        };

        Theme.data.totalProducts = response.meta.count;

        // Increment Page
        _this.data.criteria.page = _this.data.criteria.page + 1;

        // Callback
        if (callback) return callback(response);

    });
};



Theme.renderProducts = function(product) {

    // Create a string of the product's html
    var html = '<div class="product">';
    if (product.images.length) html = html + '<img class="image" data-productID="' + product._id + '" src="' + product.images[0].resolution_medium + '">';
    html = html + '<p class="name">' + product.name + '</p>';
    html = html + '<p class="price">$' + product.price / 100 + '</p>';
    html = html + '</div>';

    // Append to products inside of slider
    Theme.data.slider.slick('slickAdd', html);
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
            if (!_this.utilities.cookies.hasItem('sv_popup_' + _this.data.vendee_subdomain)) Theme.showModal('#modal-popup');
        }, Theme.data.popup_timer ? Theme.data.popup_timer * 1000 : 10000);

    }

    // If popup is on an exit event (i.e., mouse leaves document)
    if (Theme.data.popup === 'exit') {

        // Add Animation Class
        $('#modal-popup').addClass('animate-wobble');

        // Listener: Mouse Leave Document
        document.body.addEventListener('mouseleave', function() {
            if (!_this.utilities.cookies.hasItem('sv_popup_' + _this.data.vendee_subdomain)) Theme.showModal('#modal-popup');
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
            return _this.hideModal('sv_popup_' + Theme.data.vendee_subdomain, 'seen', 604800);
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

/**
 * Add More Products
 * - Determines distance from end of carousel and adds more products
 */

Theme._extendProducts = function(slick, currentSlide) {

    var detectThreshold = slick.slideCount - slick.currentSlide;
    var slideDirection = slick.currentSlide - Theme.data.oldIndex;
    var numPages = Math.ceil(Theme.data.totalProducts / 10);

    //Determine swipe direction and record position relative to origin
    if (slideDirection > 0) Theme.data.swipeCount++;
    else if (slideDirection < 0) Theme.data.swipeCount--;

    //Reset position relative to origin if origin is visited
    if (slick.currentSlide === 0) Theme.data.swipeCount = 0;

    //Stop additional product requests when page limit exceeded
    if (Theme.data.criteria.page > numPages) return false;

    //Render next page of products if criteria met
    if (detectThreshold === 3 && slideDirection > 0 && Theme.data.swipeCount === slick.slideCount - 3) Theme.listProducts(function() {

        Theme.data.oldIndex = slick.currentSlide;

    });

    else Theme.data.oldIndex = slick.currentSlide;
};

// End
