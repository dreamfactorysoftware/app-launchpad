Actions = ({
    init: function () {
        this.getConfig();

    },
    getConfig: function () {
        var that = this;
        $.getJSON(CurrentServer + '/rest/System/Config?app_name=launchpad')
            .done(function(configInfo){
                Config = configInfo;
                document.title = "Launchpad " + configInfo.dsp_version;
                that.updateSession("init");
                Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
            })
            .fail(function(response){
                alertErr(response);
            });
    },
    createAccount: function () {
        window.location="register.html";
    },
    getApps: function (data, action) {
        $('#error-container').empty().hide();


        AllApps = [];
        AllApps = data.no_group_apps;
        data.app_groups.forEach(function (group) {
            group.apps.forEach(function (app) {
                AllApps.push(app);
            });
        });
        var defaultShown = false;
        $("#default_app").empty();
        AllApps.forEach(function (app) {
            if (app.is_default) {
                Actions.showApp(app.api_name, app.launch_url, app.is_url_external, app.requires_fullscreen);
                //window.defaultApp = app.id;
                defaultShown=true;
            }
            var option = '<option value="' + app.id + '">' + app.name + '</option>';
            $("#default_app").append(option);
        });
        var noption = '<option value="">None</option>';
        $("#default_app").append(noption);
        //$("#default_app").val(window.defaultApp);
        if(action == "update"){
            return;
        }
        if (data.is_sys_admin && !defaultShown) {
            this.showApp('admin', '/public/admin/#/app', '0', false);
        } else if (data.app_groups.length == 1 && data.app_groups[0].apps.length == 1 && data.no_group_apps.length == 0) {
            $('#app-list-container').hide();
            this.showApp(data.app_groups[0].apps[0].api_name, data.app_groups[0].apps[0].launch_url, data.app_groups[0].apps[0].is_url_external, data.app_groups[0].apps[0].requires_fullscreen);
            return;
        } else if (data.app_groups.length == 0 && data.no_group_apps.length == 1) {
            $('#app-list-container').hide();
            this.showApp(data.no_group_apps[0].api_name, data.no_group_apps[0].launch_url, data.no_group_apps[0].is_url_external,data.no_group_apps[0].requires_fullscreen);
            return;
        } else if (data.app_groups.length == 0 && data.no_group_apps.length == 0) {
            $('#error-container').html("Sorry, it appears you have no active applications.  Please contact your system administrator").show();
            return;
        }else{
            $('#fs_toggle').addClass('disabled');
            $('#app-list-container').show();
        }

    },
    showApp: function (name, url, type, fullscreen, allowfullscreentoggle) {

        $('#fs_toggle').addClass('disabled');
        $('#app-list-container').hide();
        $('#apps-list-btn').removeClass('disabled');

        $('iframe').hide();

        // Show the admin if your an admin
        if (name == "admin") {
            if ($('#admin').length > 0) {
                $('#adminLink').addClass('disabled');

                // This reloads the admin app
                // Did this because when we just $.show(see commented out line below)
                // Angular hasn't populated the DOM because it's fallen out of scope
                // I think
                $('#admin').replaceWith(
                    $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', CurrentServer + url).appendTo('#app-container')
                );
                //$('#admin').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', CurrentServer + url).show();
            } else {
                $('#adminLink').addClass('disabled');
                $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', CurrentServer + url).appendTo('#app-container');
            }
            return;
        }


        // check if there is an element with this id
        if ($("#" + name).length > 0) {


            //check if that element requires fullscreen
            if(fullscreen){
                //Actions.toggleFullScreen(true);

                // It does require fullscreen.
                // Set app-container to full screen
                // No other app should be run
                this.requireFullScreen();
            }

            // Show the app

            if(!allowfullscreentoggle){
                $('#fs_toggle').off('click', function() {
                    Actions.toggleFullScreen(false);
                });
            } else if(allowfullscreentoggle) {
                $('#fs_toggle').removeClass('disabled');
                $('#fs_toggle').on('click', function() {
                    Actions.toggleFullScreen(true);
                });

            }

            $("#" + name).show();


            return;
        }

        $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', url).appendTo('#app-container');


        /*
         if(fullscreen && name != "admin"){
         this.toggleFullScreen(true);
         }
         */

        // Check if the name is admin
        if(name != 'admin'){
            //$('#fs_toggle').show();

            // Check if the app requires fullscreen
            if(fullscreen){

                // It does so fire it up in fullscreen mode
                Actions.requireFullScreen();
            }else{
                if(!allowfullscreentoggle){
                    $('#fs_toggle').off('click', function() {
                        Actions.toggleFullScreen(false);
                    });
                } else if(allowfullscreentoggle) {
                    $('#fs_toggle').removeClass('disabled');
                    $('#fs_toggle').on('click', function() {
                        Actions.toggleFullScreen(true);
                    });

                }

                $('#adminLink').removeClass('disabled');

            }
        }

    },

    animateNavBarClose: function(callback) {

        var navbarH  = $('#main-nav').height();
        $('#main-nav').animate({
            height: 0
        }).removeClass('in');

        if (typeof callback == 'function') {
            callback.call(this);
        }
    },


    showAppList: function() {

        $('#apps-list-btn').addClass('disabled');
        $('#adminLink').removeClass('disabled');
        $('#fs_toggle').off('click');
        $('#fs_toggle').addClass('disabled');
        $('#app-list-container').show();
        this.animateNavBarClose();

    },
    showAdmin: function() {

        var name = 'admin',
            url = '/public/admin/#/app',
            type = 0,
            fullscreen = 0;


        this.animateNavBarClose(function() {this.showApp(name, url, type, fullscreen)});


    },

    updateSession: function (action) {

        var that = this;
        $.getJSON(CurrentServer + '/rest/User/Session?app_name=launchpad')
            .done(function(sessionInfo){
                //$.data(document.body, 'session', data);
                //var sessionInfo = $.data(document.body, 'session');

                // Check if sessionInfo has any apps in the no_group_apps array
                if(sessionInfo.no_group_apps == 0){
                    // It doesn't have any apps
                    // Fail silently
                    //console.log('fail');
                }else{
                    // It does have apps!

                    //create an array variable to store these apps
                    sessionInfo.mnm_ng_apps = [];

                    // Fire up an new object
                    var apps = {};

                    // create the property 'apps' on our new object
                    apps.apps = sessionInfo.no_group_apps;

                    // push this new app object onto our array
                    sessionInfo.mnm_ng_apps.push(apps);

                    // **Note** I'm doing all this to mimick how the app_groups are returned
                    // in order to put ungrouped apps into a group for display.
                    // I know there is a better way...
                }


                CurrentUserID = sessionInfo.id;
                if(CurrentUserID) {
                    sessionInfo.activeSession = true;
                }

                Templates.loadTemplate(Templates.navBarTemplate, {User: sessionInfo}, 'navbar-container');
                Templates.loadTemplate(Templates.appIconTemplate, {Applications: sessionInfo}, 'app-list-container');

                if (sessionInfo.is_sys_admin) {
                    $('#adminLink').addClass('disabled');
                    $('#fs_toggle').addClass('disabled');
                    $('#apps-list-btn').removeClass('disabled');
                    $('#fs_toggle').off('click');
                }


                if(action == "init"){
                    that.getApps(sessionInfo, action);
                }


            })
            .fail(function(response){
                if (response.status == 401) {
                    Templates.loadTemplate(Templates.navBarTemplate, Config, 'navbar-container');
                    that.doSignInDialog();
                } else if (response.status == 500) {
                    that.showStatus(response.statusText, "error");
                }
            });
    },
    //
    // sign in functions
    //
    clearSignIn: function () {
        $('#UserEmail').val('');
        $('#Password').val('');

    },
    doSignInDialog: function (stay) {

        window.Stay = false;
        if(stay){
            $('#loginErrorMessage').removeClass('alert-error').html("Your Session has expired. Please log in to continue");
            this.clearSignIn();
            $("#loginDialog").modal('show');
            window.Stay = true;
        }else{
            $('#loginErrorMessage').removeClass('alert-error').html("Please enter your User Email and Password below to sign in.");
            this.clearSignIn();
            $("#loginDialog").modal('show');
            window.Stay = false;
        }
    },
    signIn: function () {

        var that = this;
        if (!$('#UserEmail').val() || !$('#Password').val()) {
            $("#loginErrorMessage").addClass('alert-error').html('You must enter User Email and Password to continue.');
            return;
        }
        $('#loading').show();
        $.post(CurrentServer + '/rest/User/Session?app_name=launchpad', JSON.stringify({email: $('#UserEmail').val(), password: $('#Password').val()}))
            .done(function(data){
                if(Stay){
                    $("#loginDialog").modal('hide');
                    $("#loading").hide();
                    return;

                }

                $.data(document.body, 'session', data);

                var sessionInfo = $.data(document.body, 'session');

                // Check if sessionInfo has any apps in the no_group_apps array
                if(sessionInfo.no_group_apps == 0){
                    // It doesn't have apps
                    // Fail silently
                    //console.log('fail');
                }else{
                    // It does have apps!

                    //create an array variable to store these apps
                    sessionInfo.mnm_ng_apps = [];

                    // Fire up an new object
                    var apps = {};

                    // create the property 'apps' on our new object
                    apps.apps = sessionInfo.no_group_apps;

                    // push this new app object onto our array
                    sessionInfo.mnm_ng_apps.push(apps);

                    // **Note** I'm doing all this to mimick how the app_groups are returned
                    // in order to put ungrouped apps into a group for display.
                    // I know there is a better way...
                }

                CurrentUserID = sessionInfo.id;
                if (CurrentUserID) {
                    sessionInfo.activeSession = true;
                }

                Templates.loadTemplate(Templates.navBarTemplate, {User: sessionInfo}, 'navbar-container');
                Templates.loadTemplate(Templates.appIconTemplate, {Applications: sessionInfo}, 'app-list-container');
                Actions.getApps(sessionInfo);
                $("#loginDialog").modal('hide');
                $("#loading").hide();
            })
            .fail(function(response){
                $("#loading").hide();
                $("#loginErrorMessage").addClass('alert-error').html(getErrorString(response));
            });

    },
    //
    // forgot password functions
    //
    clearForgotPassword: function () {

        $('#Answer').val('');
    },
    doForgotPasswordDialog: function () {
        var that = this;
        if ($('#UserEmail').val() == '') {
            $("#loginErrorMessage").addClass('alert-error').html('You must enter User Email to continue.');
            return;
        }
        $.ajax({
            dataType: 'json',
            url: CurrentServer + '/rest/User/Challenge',
            data: 'app_name=launchpad&email=' + $('#UserEmail').val() + '&method=GET',
            cache: false,
            success: function (response) {
                if (response.security_question) {
                    $("#Question").html(response.security_question);
                    $("#loginDialog").modal('hide');
                    that.clearForgotPassword();
                    $("#forgotPasswordErrorMessage").removeClass('alert-error').html('Please answer your security question to log in.');
                    $("#forgotPasswordDialog").modal('show');
                } else {
                    $("#loginErrorMessage").addClass('alert-error').html('Unable to retrieve your security question.');
                }
            },
            error: function (response) {
                $("#loginErrorMessage").addClass('alert-error').html('Unable to retrieve your security question.');
            }
        });

    },
    toggleFullScreen: function(toggle){
        if(toggle){
            $('#app-container').css({"top":"0px", "z-index" :999998});
            $('#rocket').show();
        }else{
            $('#app-container').css({"top":"44px", "z-index" :1});
            $('#rocket').hide();
        }
    },

    requireFullScreen: function() {
        $('#app-container').css({"top":"0px", "z-index" :999998});
    },
    forgotPassword: function () {

        if ($('#Answer').val()) {
            var that = this;
            $.ajax({
                dataType: 'json',
                type: 'POST',
                url: CurrentServer + '/REST/User/Challenge/?app_name=launchpad&email=' + $('#UserEmail').val() + '&method=POST',
                data: JSON.stringify({security_answer: $('#Answer').val()}),
                cache: false,
                success: function (response) {
                    $('#forgotPasswordErrorMessage').removeClass('alert-error');
                    $("#forgotPasswordDialog").modal('hide');
                    that.clearForgotPassword();
                    User = response;
                    that.showUserInfo(response);
                    that.getApps(response);
                    CurrentUserID = response.id;
                    if (response.is_sys_admin) {
                        that.buildAdminDropDown();
                    }
                },
                error: function (response) {
                    $("#forgotPasswordErrorMessage").addClass('alert-error').html('Please check the answer to your security question.');
                }
            });
        } else {
            $("#forgotPasswordErrorMessage").addClass('alert-error').html('You must enter the security answer to continue, or contact your administrator for help.');
        }
    },
    //
    // edit profile functions
    //
    clearProfile: function () {

        $("#email").val('');
        $("#firstname").val('');
        $("#lastname").val('');
        $("#displayname").val('');
        $("#phone").val('');
        $("#security_question").val('');
        $("#security_answer").val('');
    },
    doProfileDialog: function () {
        this.animateNavBarClose();
        var that = this;
        $.ajax({
            dataType: 'json',
            url: CurrentServer + '/rest/User/Profile/' + CurrentUserID + '/',
            data: 'method=GET&app_name=launchpad',
            cache: false,
            success: function (response) {
                Profile = response;
                that.fillProfileForm();
                $("#changeProfileErrorMessage").removeClass('alert-error').html('Use the form below to change your user profile.');
                $('#changeProfileDialog').modal('show');

            },
            error: function (response) {
                if (response.status == 401) {
                    that.doSignInDialog();
                }
            }
        });
    },
    fillProfileForm: function () {

        $("#email").val(Profile.email);
        $("#firstname").val(Profile.first_name);
        $("#lastname").val(Profile.last_name);
        $("#displayname").val(Profile.display_name);
        $("#phone").val(Profile.phone);
        $("#default_app").val(Profile.default_app_id);
        if (Profile.security_question) {
            $("#security_question").val(Profile.security_question);
        } else {
            $("#security_question").val('');
        }
        $("#security_answer").val('');
    },
    updateProfile: function () {

        var that = this;
        NewUser = {};
        NewUser.email = $("#email").val();
        NewUser.first_name = $("#firstname").val();
        NewUser.last_name = $("#lastname").val();
        NewUser.display_name = $("#displayname").val();
        NewUser.phone = $("#phone").val();
        NewUser.default_app_id = $("#default_app").val();
        // require question
        var q = $("#security_question").val();
        if (q == '') {
            $("#changeProfileErrorMessage").addClass('alert-error').html('Please enter a security question.');
            return;
        }
        var a = $("#security_answer").val();
        if (q != Profile.security_question) {
            // require answer if question has changed
            if (a == '') {
                $("#changeProfileErrorMessage").addClass('alert-error').html('You changed your security question. Please enter a security answer.');
                return;
            }
            NewUser.security_question = q;
        }
        if (a != '') {
            NewUser.security_answer = a;
        }
        $.ajax({
            dataType: 'json',
            type: 'POST',
            url: CurrentServer + '/rest/User/Profile/' + CurrentUserID + '/?method=MERGE&app_name=launchpad',
            data: JSON.stringify(NewUser),
            cache: false,
            success: function (response) {
                // update display name

                that.updateSession();
                $("#changeProfileDialog").modal('hide');
                that.clearProfile();
            },
            error: function (response) {
                if (response.status == 401) {
                    $("#changeProfileDialog").modal('hide');
                    that.doSignInDialog();
                } else {
                    $("#changeProfileErrorMessage").addClass('alert-error').html('There was an error updating the profile.');
                }
            }
        });
    },
    //
    // change password functions
    //
    clearChangePassword: function () {

        $('#OPassword').val('');
        $('#NPassword').val('');
        $('#VPassword').val('');
    },
    doChangePasswordDialog: function () {

        $('#changePasswordErrorMessage').removeClass('alert-error').html('Use the form below to change your password.');
        this.clearChangePassword();
        this.animateNavBarClose(function() {$("#changePasswordDialog").modal('show')});
    },
    checkPassword: function () {

        if ($("#OPassword").val() == '' || $("#NPassword").val() == '' || $("#VPassword").val() == '') {
            $("#changePasswordErrorMessage").addClass('alert-error').html('You must enter old and new passwords.');
            return;
        }
        if ($("#NPassword").val() == $("#VPassword").val()) {
            var data = {
                old_password: $("#OPassword").val(),
                new_password: $("#NPassword").val()
            };
            this.updatePassword(JSON.stringify(data));
        } else {
            $("#changePasswordErrorMessage").addClass('alert-error').html('<b style="color:red;">Passwords do not match!</b> New and Verify Password fields need to match before you can submit the request.');
        }
    },
    updatePassword: function (pass) {
        var that = this;
        $.ajax({
            dataType: 'json',
            type: 'POST',
            url: CurrentServer + '/rest/User/Password/?method=MERGE&app_name=launchpad',
            data: pass,
            cache: false,
            success: function (response) {
                $("#changePasswordDialog").modal('hide');
                that.clearChangePassword();
            },
            error: function (response) {
                if (response.status == 401) {
                    $("#changePasswordDialog").modal('hide');
                    that.doSignInDialog();
                } else {
                    $("#changePasswordErrorMessage").addClass('alert-error').html('There was an error changing the password. Make sure you entered the correct old password.');
                }
            }
        });
    },
    //
    // sign out functions
    //
    doSignOutDialog: function () {

        $("#logoffDialog").modal('show');
    },
    signOut: function () {
        var that = this;
        $.ajax({
            dataType: 'json',
            type: 'POST',
            url: CurrentServer + '/rest/User/Session/' + CurrentUserID + '/',
            data: 'app_name=launchpad&method=DELETE',
            cache: false,
            success: function (response) {
                $('#app-container').empty();
                $('#app-list-container').empty();
                $('#app-list').empty();
                $('#admin-container').empty();
                $("#logoffDialog").modal('hide');
                that.updateSession("init");

            },
            error: function (response) {
                if (response.status == 401) {
                    //that.showSignInButton();
                    Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
                    that.doSignInDialog();
                }
            }
        });
    },
    showSignInButton: function () {

        $("#dfControl1").html('<a class="btn btn-primary" onclick="this.doSignInDialog()"><li class="icon-signin"></li>&nbsp;Sign In</a> ');
        if (Config.allow_open_registration) {
            $("#dfControl1").append('<a class="btn btn-primary" onclick="this.createAccount()"><li class="icon-key"></li>&nbsp;Create Account</a> ');
        }
    },
    showStatus: function (message, type) {
        if (type == "error") {
            $('#error-container').html(message).removeClass().addClass('alert alert-danger center').show().fadeOut(10000);
        } else {
            $('#error-container').html(message).removeClass().addClass('alert alert-success center').show().fadeOut(5000);
        }
    }
});
$(document).ready(function () {
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) {
        e.stopPropagation();
    });
    $('body').css('height', ($(window).height() + 44) + 'px');
    $(window).resize(function () {
        $('body').css('height', ($(window).height() + 44) + 'px');
    });

    function doPasswordVerify() {

        var value = $("#NPassword").val();
        var verify = $("#VPassword").val();
        if (value.length > 0 && verify.length > 0) {
            if (value == verify) {
                $("#NPassword").removeClass("RedBorder");
                $("#NPassword").addClass("GreenBorder");
                $("#VPassword").removeClass("RedBorder");
                $("#VPassword").addClass("GreenBorder");
            } else {
                $("#NPassword").removeClass("GreenBorder");
                $("#NPassword").addClass("RedBorder");
                $("#VPassword").removeClass("GreenBorder");
                $("#VPassword").addClass("RedBorder");
            }
        } else {
            $("#NPassword").removeClass("RedBorder");
            $("#NPassword").removeClass("GreenBorder");
            $("#VPassword").removeClass("RedBorder");
            $("#VPassword").removeClass("GreenBorder");
        }
    }

    $("#NPassword").keyup(doPasswordVerify);
    $("#VPassword").keyup(doPasswordVerify);

    function checkEnterKey(e, action) {

        if (e.keyCode == 13) {
            action();
        }
    }

    $('#loginDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.signIn);
    });

    $('#forgotPasswordDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.forgotPassword);
    });

    $('#changeProfileDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.updateProfile);
    });

    $('#changePasswordDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.checkPassword);
    });
});
Actions.init();