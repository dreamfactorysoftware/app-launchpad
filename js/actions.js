Actions = ({
    init: function () {
        this.updateSession();
        Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
    },
    getApps: function (data) {
        $('#error-container').empty().hide();

        Applications = {Applications: data};
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
                Actions.showApp(app.api_name, app.url, app.is_url_external, app.requires_fullscreen);
                //window.defaultApp = app.id;
                defaultShown=true;
            }
            var option = '<option value="' + app.id + '">' + app.name + '</option>';
            $("#default_app").append(option);
        });
        var noption = '<option value="">None</option>';
        $("#default_app").append(noption);
        //$("#default_app").val(window.defaultApp);
        if (data.is_sys_admin && !defaultShown) {
            this.showApp('admin', '/public/admin/#/app', '0', false);
        } else if (data.app_groups.length == 1 && data.app_groups[0].apps.length == 1 && data.no_group_apps.length == 0) {
            $('#app-list-container').hide();
            this.showApp(data.app_groups[0].apps[0].api_name, data.app_groups[0].apps[0].url, data.app_groups[0].apps[0].is_url_external, data.app_groups[0].apps[0].requires_fullscreen);
            return;
        } else if (data.app_groups.length == 0 && data.no_group_apps.length == 1) {
            $('#app-list-container').hide();
            this.showApp(data.no_group_apps[0].api_name, data.no_group_apps[0].url, data.no_group_apps[0].is_url_external,data.app_groups[0].apps[0].requires_fullscreen);
            return;
        } else if (data.app_groups.length == 0 && data.no_group_apps.length == 0) {
            $('#error-container').html("Sorry, it appears you have no active applications.  Please contact your system administrator").show();
            return;
        }
        if (data.app_groups.length != 0 || data.no_group_apps.length != 0) {
            this.LoadAppTemplates();
        }
    },
    LoadAppTemplates: function () {

        Templates.loadTemplate(Templates.navBarDropDownTemplate, Applications, 'app-list');
        Templates.loadTemplate(Templates.appIconTemplate, Applications, 'app-list-container');
    },
    showAdminIcon: function () {
        var template = '<a id="adminLink" class="btn btn-inverse" title="Admin Console" onclick="Actions.showApp(\'admin\',\'/public/admin/#/app\',\'0\')">' +
            '<i class="icon-cog"></i>';
        //Templates.loadTemplate(Templates.adminDropDownTemplate, null, 'admin-container');
        $('#dfControl1 .btn-group').append(template);
    },
    showApp: function (name, url, type, fullscreen) {

        $('#app-list-container').hide();
        $('iframe').hide();
        if (name == "admin") {
            if ($('#admin').length > 0) {
                $('#admin').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', CurrentServer + url).show();
            } else {
                $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', CurrentServer + url).appendTo('#app-container');
            }
            return;
        }
        if ($("#" + name).length > 0) {
            if(fullscreen){
                this.toggleFullScreen(true);
            }
            $("#" + name).show();

            return;
        }
        if (type == 1) {
            $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', url).appendTo('#app-container');
        } else {
            $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', CurrentServer + '/app/' + name + url).appendTo('#app-container');
        }
        if(fullscreen){
            this.toggleFullScreen(true);
        }
    },
    showUserInfo: function (user) {

        Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
        if (user.username != 'guest') {
            Templates.loadTemplate(Templates.userInfoTemplate, user, 'dfControl1');
        }
    },
    updateSession: function (action) {
        Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
        var that = this;
        $.getJSON(CurrentServer + '/rest/User/Session?app_name=launchpad')
            .done(function(data){
                $.data(document.body, 'session', data);
                var sessionInfo = $.data(document.body, 'session');
                if (sessionInfo.username != 'guest') {
                    Templates.loadTemplate(Templates.userInfoTemplate, sessionInfo, 'dfControl1');
                }
                Templates.loadTemplate(Templates.navBarDropDownTemplate, {Applications: sessionInfo}, 'app-list');
                if (sessionInfo.is_sys_admin) {
                    that.showAdminIcon();
                }
                CurrentUserID = sessionInfo.id;
                Actions.getApps(sessionInfo);
            })
            .fail(function(response){
                if (response.status == 401) {
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
        $('#UserName').val('');
        $('#Password').val('');

    },
    doSignInDialog: function () {

        $('#loginErrorMessage').removeClass('alert-error').html("Please enter your User Name and Password below to sign in.");
        this.clearSignIn();
        $("#loginDialog").modal('show');
    },
    signIn: function () {
        var that = this;
        if (!$('#UserName').val() || !$('#Password').val()) {
            $("#loginErrorMessage").addClass('alert-error').html('You must enter User Name and Password to continue.');
            return;
        }
        $('#loading').show();
        $.post(CurrentServer + '/rest/User/Session?app_name=launchpad', JSON.stringify({UserName: $('#UserName').val(), Password: $('#Password').val()}))
            .done(function(data){
                $.data(document.body, 'session', data);
                Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
                var sessionInfo = $.data(document.body, 'session');
                if (sessionInfo.username != 'guest') {
                    Templates.loadTemplate(Templates.userInfoTemplate, sessionInfo, 'dfControl1');
                }
                Templates.loadTemplate(Templates.navBarDropDownTemplate, {Applications: sessionInfo}, 'app-list');
                if (sessionInfo.is_sys_admin) {
                    Actions.showAdminIcon();
                }
                CurrentUserID = sessionInfo.id;
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
    // reset password functions
    //
    clearResetPassword: function () {

        $('#Answer').val('');
        $('#NPasswordReset').val('');
        $('#VPasswordReset').val('');
    },
    doResetPasswordDialog: function () {
        var that = this;
        if ($('#UserName').val() == '') {
            $("#loginErrorMessage").addClass('alert-error').html('You must enter User Name to continue.');
            return;
        }
        $.ajax({
            dataType: 'json',
            url: CurrentServer + '/rest/User/Challenge',
            data: 'app_name=launchpad&username=' + $('#UserName').val() + '&method=GET',
            cache: false,
            success: function (response) {
                if (response.security_question) {
                    $("#Question").html(response.security_question);
                    $("#loginDialog").modal('hide');
                    that.clearResetPassword();
                    $("#resetErrorMessage").removeClass('alert-error').html('Please complete the form below to reset your password.');
                    $("#resetPasswordDialog").modal('show');
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
    resetPassword: function () {

        if ($('#Answer').val() && $('#NPasswordReset').val() && $('#VPasswordReset').val()) {
            if ($("#NPasswordReset").val() == $("#VPasswordReset").val()) {
                var that = this;
                $.ajax({
                    dataType: 'json',
                    type: 'POST',
                    url: CurentServer + '/REST/User/Challenge/?app_name=launchpad&username=' + $('#UserName').val() + '&method=POST',
                    data: JSON.stringify({security_answer: $('#Answer').val(), new_password: $('#NPasswordReset').val()}),
                    cache: false,
                    success: function (response) {
                        $('#resetErrorMessage').removeClass('alert-error');
                        $("#resetPasswordDialog").modal('hide');
                        that.clearResetPassword();
                        User = response;
                        that.showUserInfo(response);
                        that.getApps(response);
                        CurrentUserID = response.id;
                        if (response.is_sys_admin) {
                            that.buildAdminDropDown();
                        }
                    },
                    error: function (response) {
                        $("#resetErrorMessage").addClass('alert-error').html('The password could not be reset with the entered values. Please check the answer to your security question.');
                    }
                });
            } else {
                $("#resetErrorMessage").addClass('alert-error').html('<b style="color:red;">Passwords do not match!</b> New and Verify Password fields need to match before you can submit the request.');
            }
        } else {
            $("#resetErrorMessage").addClass('alert-error').html('You must enter the security answer and a new password to continue, or contact your administrator for help.');
        }
    },
    //
    // edit profile functions
    //
    clearProfile: function () {

        $("#displayname").val('');
        $("#firstname").val('');
        $("#lastname").val('');
        $("#email").val('');
        $("#phone").val('');
        $("#security_question").val('');
        $("#security_answer").val('');
    },
    doProfileDialog: function () {
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

        $("#displayname").val(Profile.display_name);
        $("#firstname").val(Profile.first_name);
        $("#lastname").val(Profile.last_name);
        $("#email").val(Profile.email);
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
        NewUser.display_name = $("#displayname").val();
        NewUser.first_name = $("#firstname").val();
        NewUser.last_name = $("#lastname").val();
        NewUser.email = $("#email").val();
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
        $("#changePasswordDialog").modal('show');
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
                that.updateSession();
            },
            error: function (response) {
                if (response.status == 401) {
                    that.showSignInButton();
                    that.doSignInDialog();
                }
            }
        });
    },
    showSignInButton: function () {

        $("#dfControl1").html('<a class="btn btn-primary" onclick="this.doSignInDialog()"><li class="icon-signin"></li>&nbsp;Sign In</a> ');
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

    function doPasswordResetVerify() {

        var value = $("#NPasswordReset").val();
        var verify = $("#VPasswordReset").val();
        if (value.length > 0 && verify.length > 0) {
            if (value == verify) {
                $("#NPasswordReset").removeClass("RedBorder");
                $("#NPasswordReset").addClass("GreenBorder");
                $("#VPasswordReset").removeClass("RedBorder");
                $("#VPasswordReset").addClass("GreenBorder");
            } else {
                $("#NPasswordReset").removeClass("GreenBorder");
                $("#NPasswordReset").addClass("RedBorder");
                $("#VPasswordReset").removeClass("GreenBorder");
                $("#VPasswordReset").addClass("RedBorder");
            }
        } else {
            $("#NPasswordReset").removeClass("RedBorder");
            $("#NPasswordReset").removeClass("GreenBorder");
            $("#VPasswordReset").removeClass("RedBorder");
            $("#VPasswordReset").removeClass("GreenBorder");
        }
    }

    $("#NPassword").keyup(doPasswordVerify);
    $("#VPassword").keyup(doPasswordVerify);
    $("#NPasswordReset").keyup(doPasswordResetVerify);
    $("#VPasswordReset").keyup(doPasswordResetVerify);

    function checkEnterKey(e, action) {

        if (e.keyCode == 13) {
            action();
        }
    }

    $('#loginDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.signIn);
    });

    $('#resetPasswordDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.resetPassword);
    });

    $('#changeProfileDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.updateProfile);
    });

    $('#changePasswordDialog input').keydown(function (e) {
        checkEnterKey(e, Actions.checkPassword);
    });
});
Actions.init();
