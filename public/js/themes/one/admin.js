/**
 * Admin Functions
 */

Theme.admin = {

    timers: {
        settings: false
    },

    initializeAdmin: function() {

        var _this = this;

        // Populate Servant Select Menu
        Servant.getUserAndServants(Theme.data.access_token, function(error, response) {
            for (i = 0; i < response.servants.length; i++) {
                var s = response.servants[i];
                var html = '<option value="' + s._id + '"';
                if (s._id === Theme.data.servant_id) html = html + ' selected ';
                if (s.master) html = html + '>' + s.master + '</option>';
                else html = html + '>No Master (' + s.personality + ')</option>';
                $('#servant-select').append(html);
            }
        });

        // Initialize: Perfect Scrollbar for Admin Menu
        Ps.initialize(document.getElementById('admin-menu-inner'), {
            wheelSpeed: 2,
            wheelPropagation: true,
            minScrollbarLength: 20,
            includePadding: true,
            suppressScrollX: true
        });

        // Initialize: Perfect Scrollbar for Servant Images Modal
        Ps.initialize(document.getElementById('image-results'), {
            wheelSpeed: 2,
            wheelPropagation: true,
            minScrollbarLength: 20,
            includePadding: true,
            suppressScrollX: true
        });

        // Listener: Admin Menu Form Changes
        $('.blog-option-text').keyup(function() {
            return _this.processSettings();
        });

        // Listener: Admin Menu Popup Select Change
        $('.select-option').change(function() {
            return _this.processSettings();
        });

        // Listener: Admin Menu Servant Select Change
        $('#servant-select').change(function() {
            window.location.href = '/api/blog/servant/' + $('#servant-select').val();
        });

        // Listener: Infinite Scroll
        $('#image-results').scroll(function() {
            var difference = $('#image-results')[0].scrollHeight - $('#image-results').scrollTop();
            if (difference < 600) return _this.loadServantImages();
        });

        // Show Welcome Modal
        if (!Theme.utilities.cookies.getItem('sp_welcome_' + Theme.data.blog_subdomain)) {
            setTimeout(function() {
                Theme.showModal('#modal-welcome');
            }, 1000);
        }

    },

    toggleMenu: function() {

        $(".site").animate({
            left: Theme.data.menu ? '0' : '260'
        }, {
            duration: 150,
            specialEasing: {
                height: "easeOut"
            }
        });

        Theme.data.menu = !Theme.data.menu;

    },


    changeTheme: function(direction) {
        var _this = this;

        var theme = $('#page').attr('data-theme');
        var new_theme_index = Theme.data.themes.indexOf(theme) + direction;
        if (new_theme_index < 0) new_theme_index = Theme.data.themes.length - 1;
        if (new_theme_index >= Theme.data.themes.length) new_theme_index = 0;
        $('.site').removeClass(theme);
        $('.site').addClass(Theme.data.themes[new_theme_index]);
        $('.site').attr('data-theme', Theme.data.themes[new_theme_index]);

        // Save Settings
        return _this.saveSettings({
            theme: Theme.data.themes[new_theme_index]
        });
    },


    processSettings: function() {
        var _this = this;

        // Create object of form values
        var a = $('#blog-options').serializeArray();
        var o = {};
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });

        // Save Settings
        if (_this.timers.settings) clearTimeout(_this.timers.settings);
        _this.timers.settings = setTimeout(function() {
            _this.saveSettings(o);
        }, 500);

        // Update DOM
        $('.site-title').text(o.blog_title);
        $('.site-description').text(o.blog_description);
        // Social Icons
        if (o.url_home && o.url_home !== '') $('.url_home').attr('href', o.url_home).parent().show();
        else $('.url_home').parent().hide();
        if (o.url_twitter && o.url_twitter !== '') $('.url_twitter').attr('href', o.url_twitter).parent().show();
        else $('.url_twitter').parent().hide();
        if (o.url_facebook && o.url_facebook !== '') $('.url_facebook').attr('href', o.url_facebook).parent().show();
        else $('.url_facebook').parent().hide();
        if (o.url_github && o.url_github !== '') $('.url_github').attr('href', o.url_github).parent().show();
        else $('.url_github').parent().hide();
        // Popup Form 
        if (o.popup !== 'timer') $("input[name='popup_timer']").hide();
        else $("input[name='popup_timer']").show();

        // Remove Popup Cookie
        Theme.utilities.cookies.removeItem('sp_popup_' + Theme.data.blog_subdomain);

    },


    saveSettings: function(settings, callback) {

        settings.subdomain = Theme.data.blog_subdomain;

        $.ajax({
            url: "/api/settings",
            method: 'POST',
            data: settings,
            dataType: 'json'
        }).done(function(response) {}).fail(function(jqXHR) {});

    },

    showServantImagesModal: function() {

        var _this = this;

        // Defaults
        Theme.data.servant_images_page = 1;
        Theme.data.servant_images_more = true;
        Theme.data.servant_images_loading = false;

        // Clear Modal HTML
        $('#image-results').html('');

        // Show Modal
        Theme.showModal('#modal-images');

        // Query Images
        _this.loadServantImages();

    },

    loadServantImages: function() {

        if (!Theme.data.servant_images_more || Theme.data.servant_images_loading) return;

        // Set Loading
        Theme.data.servant_images_loading = true;

        // Query Servant
        Servant.archetypesRecent(Theme.data.access_token, Theme.data.servant_id, 'image', Theme.data.servant_images_page, function(error, response) {
            console.log(response);
            // Set loading to false
            setTimeout(function() {
                Theme.data.servant_images_loading = false;
            }, 500);

            // If results are less than 10...
            if (response.records.length < 10) {
                // If they have no images on their Servant, show notice
                if (Theme.data.servant_images_page === 1 && !response.records.length) {
                    $('#image-results').append('<p style="opacity:0.5;margin-top:30px;">You have no images on this servant. <br/><br/>  Go to the <a href="https://www.servant.co" target="_blank" style="text-decoration:underline;">Servant Dashboard</a> and make some images.  Make sure your images are set to "Public". <br/><br/> Then close and re-open this pop-up.');
                    // Don't process the rest of this function
                    return;
                }
                // They have no more images, disable infinite scroll
                Theme.data.servant_images_more = false;
            }

            // Increment Page
            Theme.data.servant_images_page++;

            // Render Images
            for (i = 0; i < response.records.length; i++) {
                var html = '<div class="servant-image-container">';
                html = html + '<img class="servant-image" src="' + response.records[i].resolution_medium + '" onclick="Theme.admin.setLogoImage(\'' + response.records[i]._id + '\')">';
                htm = html + '</div>';
                $('#image-results').append(html);
            }

        });

    },

    setLogoImage: function(imageID) {
        var _this = this;

        // Save Settings
        _this.saveSettings({
            logo_image: imageID
        });

        // Show Logo Image
        Theme.loadLogoImage(imageID);

        // Hide Modal
        Theme.hideModal('#modal-images');

        // Show Admin Menu Delete Link
        $('#admin-logo-delete-link').show();

    },

    removeLogoImage: function(imageID) {
        var _this = this;

        // Save Settings
        _this.saveSettings({
            logo_image: ''
        });

        $('.logo-image').hide();
        $('#admin-logo-image-container').hide();
        $('#admin-logo-delete-link').hide();
    }
};