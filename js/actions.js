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
                $('#admin').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', 'http://' + location.host + url).show();
            } else {
                $('<iframe>').attr('frameBorder', '0').attr('id', name).attr('class', 'app-loader').attr('src', 'http://' + location.host + url).appendTo('#app-container');
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
                    $("#loginDialog").dialog("open");
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
            $("#loginDialog").dialog("close");
            $('#dfControl1').html('<i>Logging In, Please Wait...</i>');
            $.ajax({
                dataType:'json',
                type:'POST',
                url:'http://' + location.host + '/REST/User/Login/?app_name=launchpad&method=POST',
                data:JSON.stringify({UserName:$('#UserName').val(), Password:$('#Password').val()}),
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
                }
            });
        } else {
            $("#loginErrorMessage").html('<b>You must enter UserName and Password to continue</b><br/><br/>');
        }
    },
    updateUser: function(user){
        $.ajax({
            dataType:'json',
            type:'POST',
            url:'http://' + location.host + '/rest/User/change_profile/?method=MERGE&app_name=' + Actions.getAppName() ,
            data:user,
            cache:false,
            success:function (response) {
                $("#changeProfileDialog").dialog('close');

            },
            error:function (response) {

            }
        });
    },
    updatePassword: function(pass){

        $.ajax({
            dataType:'json',
            type:'POST',
            url:'http://' + location.host + '/rest/User/change_password/?method=MERGE&app_name=' + Actions.getAppName() ,
            data:pass,
            cache:false,
            success:function (response) {
                $("#changePasswordDialog").dialog('close');
            },
            error:function (response) {

            }
        });
    },
    signOut:function () {
        $.ajax({
            dataType:'json',
            type:'POST',
            url:'http://' + location.host + '/rest/User/Logout',
            data:'app_name=launchpad&method=POST',
            cache:false,
            success:function (response) {
                $('#app-container').empty();
                $('#app-list-container').empty();
                $('#app-list').empty();
                $('#admin-container').empty();
                $("#loginDialog").dialog("open");
                Actions.clearLogin();
            },
            error:function (response) {
                if (response.status == 401) {
                    $("#loginDialog").dialog("open");
                }
            }
        });
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
    $('#UserName').keydown(function (e) {
        if (e.keyCode == 13) {
            $('#Password').focus();
        }
    });

    $('#Password').keydown(function (e) {
        if (e.keyCode == 13) {
            Actions.performSignIn();
        }
    });

    $('#loginDialog').dialog({
        resizable:false,
        modal:true,
        autoOpen:false,
        buttons:{
            "Sign In":function () {
                Actions.performSignIn();
            },
            Cancel:function () {
                window.history.back();
            }
        }
    });

    $('#logoffDialog').dialog({
        resizable:false,
        modal:true,
        autoOpen:false,
        buttons:{
            "Log Off":function () {
                Actions.signOut();
                $(this).dialog("close");

            },
            Cancel:function () {
                $(this).dialog("close");
            }
        }
    });

    $("#errorDialog").dialog({
        resizable:false,
        modal:true,
        autoOpen:false,
        closeOnEscape:false,
        buttons:{    }
    });

    $("#changePasswordDialog").dialog({
        resizable:false,
        modal:true,
        autoOpen:false,
        closeOnEscape:false,
        beforeClose:function (event, ui) {
            $("#OldPassword").val("");
            $("#NPassword").val("");
            $("#VPassword").val("");
            $("#NPassword").removeClass("RedBorder");
            $("#NPassword").removeClass("GreenBorder");
            $("#VPassword").removeClass("RedBorder");
            $("#VPassword").removeClass("GreenBorder");
        },
        buttons:{
            "Change Password":function () {
                if ($("#NPassword").val() == $("#VPassword").val()) {
                    var data = {
                        oldpassword:$("#OPassword").val(),
                        newpassword:$("#NPassword").val()
                    };
                    Actions.updatePassword(JSON.stringify(data));
                } else {
                    $("#changePasswordErrorMessage").html('<b style="color:red;">Passwords do not match!</b> New and Verify Password fields need to match before you can submit the request.');
                }
            },
            Cancel:function () {
                $("#changePasswordDialog").dialog("close");
            }
        }
    });

    $("#changeProfileDialog").dialog({
        resizable:false,
        modal:true,
        autoOpen:false,
        closeOnEscape:false,
        beforeClose:function (event, ui) {

        },
        buttons:{
            "Change Profile":function () {
                NewUser = {};
                NewUser.display_name = $("#fullname").val();
                NewUser.first_name = $("#firstname").val();
                NewUser.last_name = $("#lastname").val();
                NewUser.email = $("#email").val();
                NewUser.phone = $("#phone").val();
                Actions.updateUser(JSON.stringify(NewUser));

            },
            Cancel:function () {
                $("#changeProfileDialog").dialog("close");
            }
        }
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