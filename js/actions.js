Actions = {
    getAppName:function () {
        var pathArray = window.location.pathname.split('/');
        return pathArray[pathArray.length - 2];
    },
    init:function () {
        this.upDateSession();
        Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
    },
    showError:function (errors) {
        Templates.loadTemplate(Templates.errorTemplate, errors, 'error-container');
    },
    getApps:function (data) {
        $('#error-container').empty().hide();
        Applications = {Applications:data};
        if(User.is_sys_admin){
            //do nothing for now
        }else if (data.app_groups.length == 1 && data.app_groups[0].apps.length == 1 && data.no_group_apps.length == 0) {
            $('#app-list-container').hide();
            Actions.showApp(data.app_groups[0].apps[0].name, data.app_groups[0].apps[0].url, data.app_groups[0].apps[0].is_url_external);
            return;
        } else if (data.app_groups.length == 0 && data.no_group_apps.length == 1) {
            $('#app-list-container').hide();
            this.showApp(data.no_group_apps[0].name, data.no_group_apps[0].url, data.no_group_apps[0].is_url_external);
            return;
        } else if (data.app_groups.length == 0 && data.no_group_apps.length == 0) {
            $('#error-container').html("Sorry, it appears you have no active applications.  Please contact your system administrator").show();
            return;
        }
        if (data.app_groups.length != 0 || data.no_group_apps.length != 0) {
            Actions.LoadAppTemplates();
        }
    },
    LoadAppTemplates: function(){
        Templates.loadTemplate(Templates.navBarDropDownTemplate, Applications, 'app-list');
        Templates.loadTemplate(Templates.appIconTemplate, Applications, 'app-list-container');
    },
    buildAdminDropDown:function () {
        Templates.loadTemplate(Templates.adminDropDownTemplate, null, 'admin-container');
    },
    showApp:function (name, url, type) {
        $('#app-list-container').hide();
        $('iframe').hide();
        if (name == "admin") {
            if ($('#admin').length > 0) {
                $('#admin').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', 'http://' + location.host + url).show();
            } else {
                $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('name', name).attr('class', 'app-loader').attr('src', 'http://' + location.host + url).appendTo('#app-container');
            }
            return;
        }
        if ($("#" + name).length > 0) {
            $("#" + name).show();
            return;
        }
        if (type == 1) {
            $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', url).appendTo('#app-container');
        } else {
            $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', 'http://' + location.host + '/app/' + name + url).appendTo('#app-container');
        }
    },
    showUserInfo:function (user) {
        Templates.loadTemplate(Templates.navBarTemplate, null, 'navbar-container');
        Templates.loadTemplate(Templates.userInfoTemplate, user, 'dfControl1');
    },
    fillProfileForm: function(){

        $("#fullname").val(User.display_name);
        $("#firstname").val(User.first_name);
        $("#lastname").val(User.last_name);
        $("#email").val(User.email);
        $("#phone").val(User.phone);
    },
    upDateSession:function () {
        $.ajax({
            dataType:'json',
            url:'http://' + location.host + '/rest/User/Session',
            data:'app_name=launchpad&method=GET',
            cache:false,
            success:function (response) {
                User = response;
                Actions.showUserInfo(response);
                Actions.getApps(response);
                CurrentUserID = response.id;
                if (response.is_sys_admin) {
                    Actions.buildAdminDropDown();
                }
                Actions.fillProfileForm();

            },
            error:function (response) {
                if (response.status == 401) {
                    $("#loginDialog").modal('toggle');
                }
            }
        });
    },
    clearLogin: function(){
        $('#UserName').val('');
        $('#Password').val('');
    },
    performSignIn:function () {
        if ($('#UserName').val() && $('#Password').val()) {

            $('#dfControl1').html('<i>Logging In, Please Wait...</i>');
            $.ajax({
                dataType:'json',
                type:'POST',
                url:'http://' + location.host + '/REST/User/Session/?app_name=launchpad&method=POST',
                data:JSON.stringify({UserName:$('#UserName').val(), Password:$('#Password').val()}),
                cache:false,
                success:function (response) {
                    $('#loginErrorMessage').removeClass('alert-error');
                    $("#loginDialog").modal('hide');
                    User = response;
                    Actions.showUserInfo(response);
                    Actions.getApps(response);
                    CurrentUserID = response.id;
                    if (response.is_sys_admin) {
                        Actions.buildAdminDropDown();
                    }
                    Actions.fillProfileForm();
                },
                error:function (response, response2) {
                    if (response.status == 401) {
                       // $("#loginDialog").modal('show');
                        //console.log(response.error[0].message);
                        $('#loginErrorMessage').addClass('alert-error').html("Invalid Login Attempt, Please Try again.")
                    }
                }
            });
        } else {
            $("#loginErrorMessage").html('<b>You must enter UserName and Password to continue</b><br/><br/>');
        }
    },
    updateUser: function(){
        NewUser = {};
               NewUser.display_name = $("#fullname").val();
                NewUser.first_name = $("#firstname").val();
                NewUser.last_name = $("#lastname").val();
                NewUser.email = $("#email").val();
                NewUser.phone = $("#phone").val();

        $.ajax({
            dataType:'json',
            type:'POST',
            url:'http://' + location.host + '/rest/User/Profile/' + CurrentUserID + '/?method=MERGE&app_name=' + Actions.getAppName() ,
            data:JSON.stringify(NewUser),
            cache:false,
            success:function (response) {
                $("#changeProfileDialog").modal('toggle');
            },
            error:function (response) {

            }
        });
    },
    updatePassword: function(pass){

        $.ajax({
            dataType:'json',
            type:'POST',
            url:'http://' + location.host + '/rest/User/Password/?method=MERGE&app_name=' + Actions.getAppName() ,
            data:pass,
            cache:false,
            success:function (response) {
                $("#changePasswordDialog").modal('toggle');
            },
            error:function (response) {

            }
        });
    },
    signOut:function () {
        $.ajax({
            dataType:'json',
            type:'POST',
            url:'http://' + location.host + '/rest/User/Session/' + CurrentUserID + '/',
            data:'app_name=launchpad&method=DELETE',
            cache:false,
            success:function (response) {
                $('#app-container').empty();
                $('#app-list-container').empty();
                $('#app-list').empty();
                $('#admin-container').empty();
                $("#loginDialog").modal('toggle');
                $("#logoffDialog").modal('toggle');
                $("#dfControl1").html('<a class="btn btn-primary" onclick="$(\'#loginDialog\').modal(\'show\')"><li class="icon-signin"></li>&nbsp;Sign In</a> ');
                Actions.clearLogin();
            },
            error:function (response) {
                if (response.status == 401) {
                    $("#loginDialog").modal('toggle');
                }
            }
        });
    },
    checkPassword: function(){
        if ($("#NPassword").val() == $("#VPassword").val()) {
            var data = {
                old_password:$("#OPassword").val(),
                new_password:$("#NPassword").val()
            };
            Actions.updatePassword(JSON.stringify(data));
        } else {
            $("#changePasswordErrorMessage").html('<b style="color:red;">Passwords do not match!</b> New and Verify Password fields need to match before you can submit the request.');
        }
    }
};
$(document).ready(function () {
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) {
        e.stopPropagation();
    });
    $('body').css('height', ($(window).height() - 76) + 'px');
    $(window).resize(function () {
        $('body').css('height', ($(window).height() - 76) + 'px');
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
});
Actions.init();