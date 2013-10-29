Actions = ({

    init: function() {
        this.getConfig();
    },

    getConfig: function() {
        var that = this;
        $.getJSON(CurrentServer + '/rest/system/config?app_name=launchpad').done(function(configInfo) {
            Config = configInfo;
            document.title = "Launchpad " + configInfo.dsp_version;
            that.updateSession("init");
            Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
        }).fail(function(response) {
                alertErr(response);
            });
    },

    createAccount: function() {
		if (Config.open_reg_email_service_id) {
			window.location = "register_via_email.html";
		}
		else{
			window.location = "register_full.html";
		}
    },

    getApps: function(data, action) {
        var _apps = [], _defaultShown = false, $_defaultApps = $('#default_app'), _options;

        $('#error-container').hide().empty();
        $_defaultApps.empty();

        if (data && data.no_group_apps) {
            _apps = data.no_group_apps;
        }

        data.app_groups.forEach(function(group) {
            group.apps.forEach(function(app) {
                _apps.push(app);
            });
        });

        _options = "";

        _apps.forEach(function(app) {
            if (app.is_default && !data.is_sys_admin) {
                Actions.showApp(app.api_name, app.launch_url, app.is_url_external, app.requires_fullscreen,
                    app.allow_fullscreen_toggle);

                //window.defaultApp = app.id;
                _defaultShown = true;


            }

            else if (app.is_default && data.is_sys_admin) {
                app.requires_fullscreen = false;

                Actions.showApp(app.api_name, app.launch_url, app.is_url_external, app.requires_fullscreen,
                    app.allow_fullscreen_toggle);


                //window.defaultApp = app.id;
                _defaultShown = true;

                $('#adminLink').on('click', function() {
                    Actions.showAdmin()
                });

                $('#adminLink').on('click', function() {
                    Actions.showAdmin()
                });

            }

            _options += '<option value="' + app.id + '">' + app.name + '</option>';
        });


        $_defaultApps.append(_options + '<option value>None</option>');

        if ('update' == action) {
            return;
        }

        if (data.is_sys_admin && _defaultShown) {
            return;
        }
        else if (data.is_sys_admin && !_defaultShown) {
            this.showApp('admin', '/public/admin/#/', '0', false);
            $('#adminLink').off('click');
            $('#fs_toggle').off('click');
        }
        else if (data.app_groups.length == 1 && data.app_groups[0].apps.length == 1 && data.no_group_apps.length == 0) {
            $('#app-list-container').hide();
            this.showApp(data.app_groups[0].apps[0].api_name, data.app_groups[0].apps[0].launch_url,
                data.app_groups[0].apps[0].is_url_external, data.app_groups[0].apps[0].requires_fullscreen,
                data.app_groups[0].apps[0].allow_fullscreen_toggle);
        }
        else if (data.app_groups.length == 0 && data.no_group_apps.length == 1) {
            $('#app-list-container').hide();
            this.showApp(data.no_group_apps[0].api_name, data.no_group_apps[0].launch_url,
                data.no_group_apps[0].is_url_external, data.no_group_apps[0].requires_fullscreen,
                data.no_group_apps[0].allow_fullscreen_toggle);
        }
        else if (data.app_groups.length == 0 && data.no_group_apps.length == 0) {
            $('#error-container').html("Sorry, it appears you have no active applications.  Please contact your system administrator").show();
        }
        else {
            Actions.showAppList();
        }
    },

    showApp: function(name, url, type, fullscreen, allowfullscreentoggle) {


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
                $('#admin').replaceWith($('<iframe>').attr('frameBorder', '0').attr('id', name).attr('name',
                    name).attr('class', 'app-loader').attr('src', CurrentServer + url).appendTo('#app-container'));
                //$('#admin').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', CurrentServer + url).show();
            }
            else {
                $('#adminLink').addClass('disabled');
                $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class',
                    'app-loader').attr('src', CurrentServer + url).appendTo('#app-container');
            }
            return;
        }

        // check if there is an element with this id
        if ($("#" + name).length > 0) {


            //check if that element requires fullscreen
            if (fullscreen) {
                //Actions.toggleFullScreen(true);

                // It does require fullscreen.
                // Set app-container to full screen
                // No other app should be run
                this.requireFullScreen();
            }

            // Show the app

            if (!allowfullscreentoggle) {
                $('#fs_toggle').off('click', function() {
                    Actions.toggleFullScreen(false);
                });
            }
            else if (allowfullscreentoggle) {
                $('#fs_toggle').removeClass('disabled');
                $('#fs_toggle').on('click', function() {
                    Actions.toggleFullScreen(true);
                });

            }

            $("#" + name).show();

            return;
        }

        $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src',
            url).appendTo('#app-container');

        /*
         if(fullscreen && name != "admin"){
         this.toggleFullScreen(true);
         }
         */

        // Check if the name is admin
        if (name != 'admin') {
            //$('#fs_toggle').show();

            // Check if the app requires fullscreen
            if (fullscreen) {

                // It does so fire it up in fullscreen mode
                Actions.requireFullScreen();
            }
            else {
                if (!allowfullscreentoggle) {
                    $('#fs_toggle').off('click', function() {
                        Actions.toggleFullScreen(false);
                    });
                }
                else if (allowfullscreentoggle) {
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

        var navbarH = $('#main-nav').height();
        $('#main-nav').animate({
            height: 0
        }).removeClass('in');

        if (typeof callback == 'function') {
            callback.call(this);
        }
    },

    showAppList: function() {

        $('#adminLink').on('click', function() {
            Actions.showAdmin()
        });
        $('#adminLink').removeClass('disabled');
        $('#fs_toggle').off('click');
        $('#fs_toggle').addClass('disabled');
        $('app-container').css({"z-index": 1});
        $('#app-list-container').show();
        $('#app-list-container').css({"z-index": 998});
        $('#apps-list-btn').addClass('disabled');
        this.animateNavBarClose();


    },
    showAdmin:   function() {

        $('#adminLink').off('click');
        $('#fs_toggle').off('click');

        var name = 'admin', url = '/public/admin/#/app', type = 0, fullscreen = 0, allowfullscreentoggle = 0;

        this.animateNavBarClose(function() {
            this.showApp(name, url, type, fullscreen, allowfullscreentoggle);

        });


    },

    appGrouper: function(sessionInfo) {
        // Check if sessionInfo has any apps in the no_group_apps array
        if (sessionInfo.no_group_apps == 0) {
            // It doesn't have any apps
            // Fail silently
            //console.log('fail');
        }
        else {
            // It does have apps!

            //create an array variable to store these apps
            sessionInfo.mnm_ng_apps = [];

            // Fire up an new object
            var apps = {};

            // create the property 'apps' on our new object
            apps.apps = sessionInfo.no_group_apps;

            var no_url_apps = [];

            $.each(apps.apps, function(k, v) {
                if (v.launch_url === '') {
                    no_url_apps.push(k);

                }
            });

            no_url_apps.reverse();

            $.each(no_url_apps, function(k, v) {
                apps.apps.splice(v, 1);
            });

            // push this new app object onto our array
            sessionInfo.mnm_ng_apps.push(apps);

            return false;

            // **Note** I'm doing all this to mimick how the app_groups are returned
            // in order to put ungrouped apps into a group for display.
            // I know there is a better way...
        }
    },
    updateSession: function(action) {

        var that = this;
        $.getJSON(CurrentServer + '/rest/user/session?app_name=launchpad').done(function(sessionInfo) {
            //$.data(document.body, 'session', data);
            //var sessionInfo = $.data(document.body, 'session');

            Actions.appGrouper(sessionInfo);

            CurrentUserID = sessionInfo.id;
            if (CurrentUserID) {
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

            if (action == "init") {
                that.getApps(sessionInfo, action);
            }

        }).fail(function(response) {
                if (response.status == 401 || response.status == 403) {
                    Templates.loadTemplate(Templates.navBarTemplate, Config, 'navbar-container');
                    that.doSignInDialog();
                }
                else if (response.status == 500) {
                    that.showStatus(response.statusText, "error");
                }
            });
    },

    //*************************************************************************
    //* Login
    //*************************************************************************

    clearSignIn: function() {
        var $_dlg = $('#loginDialog');
        var $_providers = $('.remote-login-providers', $_dlg);

        $('input', $_dlg).val('');

        if (Config.allow_remote_logins && Config.remote_login_providers) {
            $_providers.empty();

            Config.remote_login_providers.forEach(function(provider) {
                if ('1' == provider.is_active) {

                    var _icon = provider.api_name.toLowerCase();

                    if ('google' == _icon) {
                        _icon = 'google-plus';
                    }

                    $_providers.append('<i class="icon-' + _icon + ' icon-3x" data-provider="' + provider.api_name +
                        '"></i>');
                }
            });

            $('.remote-login', $_dlg).show();
        }
        else {
            $('.remote-login', $_dlg).hide();
        }
    },

    hideSignIn: function() {
        $('#loginDialog').modal('hide').off().on('hidden', function() {
            Actions.clearSignIn();
        });
    },

    doSignInDialog: function(stay) {
        var _message = $.QueryString('error');

        if (_message) {
            _message = decodeURIComponent(_message.replace(/\+/g, '%20'));
        }
        else {
            _message =
                ( stay ? 'Your Session has expired. Please log in to continue'
                    : 'Please enter your User Email and Password below to sign in.' );
        }

        window.Stay = false;
        $('#loginErrorMessage').removeClass('alert-error').empty().html(_message);
        this.clearSignIn();

        if (stay) {
            $("#loginDialog").modal('show').on('shown', function() {
                $('#UserEmail').focus();
            });
            window.Stay = true;
        }
        else {
            $("#loginDialog").modal('show').on('shown', function() {
                $('#UserEmail').focus();
            });
            window.Stay = false;
        }
    },

    signIn:            function() {

        var that = this;
        if (!$('#UserEmail').val() || !$('#Password').val()) {
            $("#loginErrorMessage").addClass('alert-error').html('You must enter your email address and password to continue.');
            return;
        }
        $('#loading').show();
        $.post(CurrentServer + '/rest/user/session?app_name=launchpad',
                JSON.stringify({email: $('#UserEmail').val(), password: $('#Password').val()})).done(function(data) {
                if (Stay) {
                    $("#loginDialog").modal('hide');
                    $("#loading").hide();
                    return;
                }

                if (data.redirect_uri) {
                    var _popup = window.open(data.redirect_uri, 'Remote Login', 'scrollbars=0');
                }

                $.data(document.body, 'session', data);

                var sessionInfo = $.data(document.body, 'session');

                Actions.appGrouper(sessionInfo);

                CurrentUserID = sessionInfo.id;
                if (CurrentUserID) {
                    sessionInfo.activeSession = true;
                }

                Templates.loadTemplate(Templates.navBarTemplate, {User: sessionInfo}, 'navbar-container');
                Templates.loadTemplate(Templates.appIconTemplate, {Applications: sessionInfo}, 'app-list-container');
                Actions.getApps(sessionInfo);
                $("#loginDialog").modal('hide');
                $("#loading").hide();
                $('#adminLink').on('click', function() {
                    Actions.showAdmin()
                });
            }).fail(function(response) {
                Actions.displayModalError('#loginErrorMessage', getErrorString(response));
            });

    },
    /**
     *
     * @param elem
     * @param message
     */
    displayModalError: function(elem, message) {
        if (message) {
            $("#loading").hide();
            $(elem).addClass('alert-error').html(message);
//			$(elem).addClass('alert-error').append('<p><i style="vertical-align: middle; padding-right: 8px;" class="icon-exclamation-sign icon-2x"></i>' + message + '</p>');
        }
        else {
            $(elem).empty().removeClass('alert-error');
        }
    },

//*************************************************************************
//* Forgot Password
//*************************************************************************

    clearForgotPassword:    function() {

		$('#Answer').val('');
		$('#NewPassword').val('');
		$('#ConfirmPassword').val('');
    },
    doForgotPasswordDialog: function() {
        var that = this;
        if ($('#UserEmail').val() == '') {
            $("#loginErrorMessage").addClass('alert-error').html('You must enter your email address to continue.');
            return;
        }
        $.ajax({
			type:     'POST',
            dataType: 'json',
			url:      CurrentServer + '/rest/user/password/?app_name=launchpad&reset=true',
			data:     JSON.stringify({email: $('#UserEmail').val()}),
            cache:    false,
            success:  function(response) {
                if (response.security_question) {
                    $("#Question").html(response.security_question);
                    $("#loginDialog").modal('hide');
                    that.clearForgotPassword();
                    $("#forgotPasswordErrorMessage").removeClass('alert-error').html('Please answer your security question and provide a new password to log in.');
                    $("#forgotPasswordDialog").modal('show');
                }
                else {
                    $("#loginErrorMessage").addClass('alert-error').html('Unable to retrieve your security question.');
                }
            },
            error:    function(response) {
                $("#loginErrorMessage").addClass('alert-error').html('Unable to retrieve your security question.');
            }
        });

    },
    forgotPassword:    function() {

		if ($('#Answer').val() == '' || $("#NewPassword").val() == '' || $("#ConfirmPassword").val() == '') {
			$("#forgotPasswordErrorMessage").addClass('alert-error').html('You must enter the answer and a new password in both password fields.');
			return;
		}
		if ($("#NewPassword").val() == $("#ConfirmPassword").val()) {
			var data = {
				email: $('#UserEmail').val(),
				security_answer: $('#Answer').val(),
				new_password: $("#NewPassword").val()
			};
			var that = this;
			$.ajax({
				dataType: 'json',
				type:     'POST',
				url:      CurrentServer + '/rest/user/password/?app_name=launchpad',
				data:     JSON.stringify(data),
				cache:    false,
				success:  function(response) {
					$('#forgotPasswordErrorMessage').removeClass('alert-error');
					$("#forgotPasswordDialog").modal('hide');
					Actions.clearForgotPassword();
					User = response;
					Actions.updateSession('init');
					Actions.getApps(response);
					CurrentUserID = response.id;
					if (response.is_sys_admin) {
						Actions.buildAdminDropDown();
					}
				},
				error:    function(response) {
					$("#forgotPasswordErrorMessage").addClass('alert-error').html('Please check the answer to your security question.');
				}
			});
		}
		else {
			$("#forgotPasswordErrorMessage").addClass('alert-error').html('<b style="color:red;">Passwords do not match!</b> New and Confirm Password fields need to match before you can submit the request.');
		}
    },

//*************************************************************************
//* Profile
//*************************************************************************

    clearProfile:    function() {

        $("#email").val('');
        $("#firstname").val('');
        $("#lastname").val('');
        $("#displayname").val('');
        $("#phone").val('');
        $("#security_question").val('');
        $("#security_answer").val('');
    },
    doProfileDialog: function() {
        this.animateNavBarClose();
        var that = this;
        $.ajax({
            dataType: 'json',
            url: CurrentServer + '/rest/user/profile/' + CurrentUserID + '/',
            data:     'method=GET&app_name=launchpad',
            cache:    false,
            success:  function(response) {
                Profile = response;
                that.fillProfileForm();
                $("#changeProfileErrorMessage").removeClass('alert-error').html('Use the form below to change your user profile.');
                $('#changeProfileDialog').modal('show');

            },
            error:    function(response) {
                if (response.status == 401) {
                    that.doSignInDialog();
                }
            }
        });
    },
    fillProfileForm: function() {

        $("#email").val(Profile.email);
        $("#firstname").val(Profile.first_name);
        $("#lastname").val(Profile.last_name);
        $("#displayname").val(Profile.display_name);
        $("#phone").val(Profile.phone);
        $("#default_app").val(Profile.default_app_id);
        if (Profile.security_question) {
            $("#security_question").val(Profile.security_question);
        }
        else {
            $("#security_question").val('');
        }
        $("#security_answer").val('');
    },
    updateProfile:   function() {

        var that = this;
        NewUser = {};
        NewUser.email = $("#email").val();
        NewUser.first_name = $("#firstname").val();
        NewUser.last_name = $("#lastname").val();
        NewUser.display_name = $("#displayname").val();
        NewUser.phone = $("#phone").val();
        NewUser.default_app_id = $("#default_app").val();

        if (NewUser.default_app_id == "") {
            NewUser.default_app_id = null;
        }
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
            type:     'POST',
            url: CurrentServer + '/rest/user/profile/' + CurrentUserID + '/?method=MERGE&app_name=launchpad',
            data:     JSON.stringify(NewUser),
            cache:    false,
            success:  function(response) {
                // update display name

                that.updateSession();
                $("#changeProfileDialog").modal('hide');
                that.clearProfile();
            },
            error:    function(response) {
                if (response.status == 401) {
                    $("#changeProfileDialog").modal('hide');
                    that.doSignInDialog();
                }
                else {
                    $("#changeProfileErrorMessage").addClass('alert-error').html('There was an error updating the profile.');
                }
            }
        });
    },

//*************************************************************************
//* Password Changing
//*************************************************************************

    clearChangePassword:    function() {

        $('#OPassword').val('');
        $('#NPassword').val('');
        $('#VPassword').val('');
    },
    doChangePasswordDialog: function() {

        $('#changePasswordErrorMessage').removeClass('alert-error').html('Use the form below to change your password.');
        this.clearChangePassword();
        this.animateNavBarClose(function() {
            $("#changePasswordDialog").modal('show')
        });
    },
    checkPassword:          function() {

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
        }
        else {
            $("#changePasswordErrorMessage").addClass('alert-error').html('<b style="color:red;">Passwords do not match!</b> New and Verify Password fields need to match before you can submit the request.');
        }
    },
    updatePassword:         function(pass) {
        var that = this;
        $.ajax({
            dataType: 'json',
            type:     'POST',
            url: CurrentServer + '/rest/user/password/?method=MERGE&app_name=launchpad',
            data:     pass,
            cache:    false,
            success:  function(response) {
                $("#changePasswordDialog").modal('hide');
                that.clearChangePassword();
            },
            error:    function(response) {
                if (response.status == 401) {
                    $("#changePasswordDialog").modal('hide');
                    that.doSignInDialog();
                }
                else {
                    $("#changePasswordErrorMessage").addClass('alert-error').html('There was an error changing the password. Make sure you entered the correct old password.');
                }
            }
        });
    },

    //*************************************************************************
    //* Logout Functions
    //*************************************************************************
    doSignOutDialog:        function() {

        $("#logoffDialog").modal('show');
    },
    signOut:                function() {
        var that = this;
        $.ajax({
            dataType: 'json',
            type:     'POST',
            url: CurrentServer + '/rest/user/session/' + CurrentUserID + '/',
            data:     'app_name=launchpad&method=DELETE',
            cache:    false,
            success:  function(response) {
                $('#app-container').empty();
                $('#app-list-container').empty();
                $('#app-list').empty();
                $('#admin-container').empty();
                $("#logoffDialog").modal('hide');
                that.updateSession("init");

            },
            error:    function(response) {
                if (response.status == 401) {
                    //that.showSignInButton();
                    Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
                    that.doSignInDialog();
                }
            }
        });
    },
    showSignInButton:       function() {

        $("#dfControl1").html('<a class="btn btn-primary" onclick="this.doSignInDialog()"><li class="icon-signin"></li>&nbsp;Sign In</a> ');
        if (Config.allow_open_registration) {
            $("#dfControl1").append('<a class="btn btn-primary" onclick="this.createAccount()"><li class="icon-key"></li>&nbsp;Create Account</a> ');
        }
    },
    showStatus:             function(message, type) {
        if (type == "error") {
            $('#error-container').html(message).removeClass().addClass('alert alert-danger center').show().fadeOut(10000);
        }
        else {
            $('#error-container').html(message).removeClass().addClass('alert alert-success center').show().fadeOut(5000);
        }
    },
	toggleFullScreen:       function(toggle) {
		if (toggle) {

			Actions.animateNavBarClose(function() {
				$('#app-container').css({"top": "0px", "z-index": 998});
				$('#navbar-container').css({
					"z-index" : 10
				});
				$('#rocket').show();
			});


		}
		else {
			$('#app-container').css({"top": "44px", "z-index": 997});
			$('#navbar-container').css({
				"z-index" : 999
			})
			$('#fs_toggle').removeClass('disabled');
			$('#rocket').hide();
		}
	},
	requireFullScreen: function() {
		$('#app-container').css({"top": "0px", "z-index": 998});
	}
});

/**
 * DocReady
 */
jQuery(function($) {
    var $_body = $('body'), $_password = $('#NPassword'), $_passwordConfirm = $('#VPassword');

    $_body.on('touchstart.dropdown', '.dropdown-menu', function(e) {
        e.stopPropagation();
    });

    $_body.css('height', ($(window).height() + 44) + 'px');

    $(window).resize(function() {
        $_body.css('height', ($(window).height() + 44) + 'px');
    });

    //@todo use jquery validate cuz this ain't working
    function doPasswordVerify() {
        var value = $_password.val(), verify = $_passwordConfirm.val();

        if (value.length && verify.length) {
            if (value == verify) {
                $_password.removeClass("RedBorder").addClass("GreenBorder");
                $_passwordConfirm.removeClass("RedBorder").addClass("GreenBorder");
            }
            else {
                $_password.removeClass("GreenBorder").addClass("RedBorder");
                $_passwordConfirm.removeClass("GreenBorder").addClass("RedBorder");
            }
        }
        else {
            $_password.removeClass("RedBorder").removeClass("GreenBorder");
            $_passwordConfirm.removeClass("RedBorder").removeClass("GreenBorder");
        }
    }

    $_password.keyup(doPasswordVerify);
    $_passwordConfirm.keyup(doPasswordVerify);

    //@todo figure out a better way to capture enter key, this sucks
    function checkEnterKey(e, action) {
        if (e.keyCode == 13) {
            action();
        }
    }

    $('#loginDialog').find('input').keydown(function(e) {
        checkEnterKey(e, Actions.signIn);
    });

    $('#forgotPasswordDialog').find('input').keydown(function(e) {
        checkEnterKey(e, Actions.forgotPassword);
    });

    $('#changeProfileDialog').find('input').keydown(function(e) {
        checkEnterKey(e, Actions.updateProfile);
    });

    $('#changePasswordDialog').find('input').keydown(function(e) {
        checkEnterKey(e, Actions.checkPassword);
    });

    /**
     * Support for remote logins
     */
    $('.remote-login-providers').on('click', 'i', function(e) {
        e.preventDefault();

        var _provider = $(this).data('provider');

        if (_provider) {
            window.top.location.href =
                '/web/remoteLogin?pid=' + _provider + '&return_url=' + encodeURI(window.top.location);
        }
    });
});

Actions.init();
