Actions = {
    //move to utils class
    getAppName:function () {
        var pathArray = window.location.pathname.split('/');
        return pathArray[pathArray.length - 2];
    },
    doLayout:function () {
        //this.getApps();
    },
    getApps:function (data, first) {
        Applications = {Applications:data};

        if (data.length == 1) {
            $('#app-list-container').hide();
            Actions.showApp(data[0].name, data[0].url, data[0].is_url_external);
            return;
        } else if (data.length == 0) {
            $('#error-container').html("Sorry, it appears you have no active applications.  Please contact your system administrator").show();
            return;
        }
        LaunchPad.templates.loadTemplate(LaunchPad.templates.navBarDropDownTemplate, Applications, 'app-list');

        if(first){
            LaunchPad.templates.loadTemplate(LaunchPad.templates.appIconTemplate, Applications, 'app-list-container');
        }

    },

    showApp:function (name, url, type) {
        $('#app-list-container').hide();
        $('iframe').hide();
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
        LaunchPad.templates.loadTemplate(LaunchPad.templates.userInfoTemplate, user, 'dfControl1');
    },
    upDateSession:function () {
        $.ajax({
            dataType:'json',
            url:'http://' + location.host + '/rest/User/Session',
            data:'app_name=launchpad&method=GET',
            cache:false,
            success:function (response) {
                //Actions.showUserInfo(response);
                Actions.getApps(response.apps);
            }

        });



    }

};

function relogin() {
    //this is nonsense
    window.location = window.location;
}

var appGrpio = null; //NOT NECESSARY

function refresh() {
    if (appGrpio) appGrpio.retrieve({order:"name"});
}

$(document).ready(function () {
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });
    //$(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

    var User = null;
    var AppGrps = null;
    var Apps = null;

    var tab_counter = 0;
    var tab_content = '';
    var $tabs = null;

    var max_chars_image = 13;
    var max_chars_button = 20;

    var singleApp = false;

    function resizeUi() {
        var o_size = $(window).height() - (($(".dfHeader").outerHeight() + $(".dfFooter").outerHeight()) + 40);
        $("#appSelector").css('height', o_size);
        $(".ui-tabs-panel").css('height', o_size - 30);
    };

    var resizeTimer = null;

    $(window).bind('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeUi, 100);
    });

    function relogin() {
        showContent(false);
        showSignInControls(true);
        doSignIn();
    }

    function refresh() {
        appGrpio.retrieve({order:"Name"});
    }

    function doSignIn() {
        $("#loginDialog").dialog("open");
    }

    //USE JQUERY SHOW/TOGGLE
    function showSignInControls(show) {
        if (show) {
            $('#dfControl1').html('Please [<a id="dfSignInLink" class="dfPointer dfTxtHeader3">Log In</a>]');
            $("#dfSignInLink").click(function () {
                $("#loginDialog").dialog("open");
            });
        } else {
            Actions.showUserInfo(User);
            Actions.getApps(User.apps, "login");
            $('#app-list-container').show();
            $("#dfSignOutLink").click(function () {
                $("#logoffDialog").dialog("open");
            });
            $("#dfProfileLnk").click(function () {
                if (User) {
                    $("#fullname").val(User.full_name);
                    $("#firstname").val(User.first_name);
                    $("#lastname").val(User.last_name);
                    $("#email").val(User.email);
                    $("#phone").val(User.phone);
                    $("#changeProfileDialog").dialog("open");
                }
            });
            $("#dfPasswordLnk").click(function () {
                $("#changePasswordDialog").dialog("open");
            });
        }
    }

    function performSignIn() {

        if ($('#UserName').val() && $('#Password').val()) {
            $("#loginDialog").dialog("close");
            $('#dfControl1').html('<i>Logging In, Please Wait...</i>');
            userio.post(JSON.stringify({UserName:$('#UserName').val(), Password:$('#Password').val()}), null, "/Login");
        } else {
            $("#loginErrorMessage").html('<b>You must enter UserName and Password to continue</b><br/><br/>');
        }

    }

    function doSignOut() {
        $("#logoffDialog").dialog("open");
    }

    function reportError(errorMsg, data) {
        var str = errorMsg.toString();
        if (str.toLowerCase().indexOf("error logging in") != -1 || str.toLowerCase().indexOf("error generating session") != -1 || str.toLowerCase().indexOf("invalidparam") != -1) {
            $("#loginErrorMessage").html('<b>' + str + '</b><br/><br/>');
            relogin();
        } else if (str.toUpperCase().indexOf("[INVALIDSESSION]") != -1) {
            // is this a ticket that is expired?
            $("#changePasswordDialog").dialog("close");
            $("#changeProfileDialog").dialog("close");
            relogin();
        } else {
            // write to both areas just in case we are not where we think we are...
            $("#changePasswordErrorMessage").html('<b>' + str + '</b><br/><br/>');
            $("#loginErrorMessage").html('<b>' + str + '</b><br/><br/>');
        }
    }


    function getAppsFor(appGrpId) {
        var tmp = [];
        for (var i in Apps) {
            if (Apps[i].app_group_ids && Apps[i].app_group_ids.length > 0 && Apps[i].app_group_ids.indexOf("," + appGrpId + ",") != -1) {
                tmp[tmp.length] = Apps[i];
            }
        }
        return tmp;
    }

    function getAppById(id) {
        for (var i in Apps) {
            if (Apps[i].id == id) {
                return Apps[i];
            }
        }
    }

    var userio = new DFRequest({
        service:'User',
        resource:'/Session',
        success:function (json, request) {
            if (!parseErrors(json, reportError)) {
                if (request) {
                    switch (request.action) {
                        case DFRequestActions.UPDATE:
                            if (request.url.indexOf("/changepassword") != -1) {
                                $("#changePasswordDialog").dialog("close");
                            }
                            break;
                        default:
                            if (json.username) {
                                User = json;
                                //appGrpio.retrieve({order:"name"});
                                showSignInControls(false);
                                $('#Password').val("");
                            } else if (json.status) {
                                $("#changeProfileDialog").dialog("close");
                                $("#changePasswordDialog").dialog("close");
                            } else {
                                showSignInControls(true);
                                doSignIn();
                            }
                            break;
                    }
                }
            }
        }
    });

    var tabOptions = {
        tabTemplate:"<li><span class='cRight dfPointer ui-icon ui-icon-close'>Remove Tab</span><a href='#{href}'>#{label}</a></li>",
        add:function (event, ui) {
            if (tab_content) $(ui.panel).append(tab_content);
        }
    };

    function showApp(app) {
        singleApp = true;
        getCurrentTicket({
            success:function (ticket) {
                var url = app.url;
                if (!(app.is_url_external)) {
                    if (url.indexOf('/') > 0 || url.indexOf('/') == -1) {
                        url = '/' + url;
                    }
                    url = getCurrentServer() + '/app/' + app.name + url;
                }
                if (url.indexOf('?') != -1) {
                    if (url.substr(-1) === "&") {
                        url += 'svr=' + escape(getCurrentServer()) + '&';
                    } else {
                        url += '&svr=' + escape(getCurrentServer()) + '&';
                    }
                } else {
                    url += '?svr=' + escape(getCurrentServer()) + '&';
                }
                url += 'app=' + escape(app.name) + '&ticket=' + escape(ticket) + '&';
                $('#dfContent').html('<div id="appSelector" class="cW100"><iframe webkitallowfullscreen="true" mozallowfullscreen="true" src="' + url + '" width="100%" height="100%" id="SINGLE_APP" border="0" frameborder="0"></iframe></div>');
                resizeUi();
            }
        });
    }

    function initTabs() {
        $('#dfContent').html('<div id="leftControl" class="cLeft"><div id="navigation"></div></div><div id="rightContent"><div class="cLeft cW100"><div id="appSelector" class="cW100"><ul></ul></div></div></div>');
        $tabs = $("#appSelector").tabs(tabOptions);
        $('#leftControl').html('<div id="navigation"></div>');
        setup();
    }

    function createDisplay(id, href, longdesc) {
        var tmp = '<iframe webkitallowfullscreen="true" mozallowfullscreen="true" class="displayFrame" frameborder="0" marginheight="0" marginwidth="0" ';
        if (id) tmp += 'name="' + id + '"';
        if (href) tmp += 'src="' + href + '" ';
        if (longdesc) tmp += 'longdesc="' + longdesc + '" ';
        tmp += '></iframe>';
        return tmp;
    }

    function addTabFunctions(tab) {
        $("span", tab).unbind('click');
        $("span", tab).click(function () {
            var $parent = $(this).parent();
            var index = $("li", $tabs).index($parent);
            $parent.find('a').each(function () {
                var id = parseInt($(this).attr('href').substring('#tabs-'.length));
                $('.btn' + id).button("option", "icons", {secondary:'ui-icon-play'});
            });
            $tabs.tabs("remove", index);
            if ($("#appSelector span.ui-icon-close").length < 1) addDefaultTab();
        });
    }


    function addDefaultTab() {
        tab_content = createDisplay('DEFAULT_TAB', 'defaulttab.html', 'Default Tab');
        ;
        addTabFunctions($tabs.tabs("add", "#tabs-DEFAULT", 'Welcome!'));
        resizeUi();
    }

    function clearTabs() {
        $('#rightContent').load('<div class="cLeft cW100"><div id="appSelector" class="cW100"><ul></ul></div></div>');
    }

    function destroySpace() {
        $('#dfContent').load("splash.html");
    }

    function showContent(sw) {
        if (sw) {
            $('#leftControl').fadeIn(250);
            $('#rightContent').fadeIn(250);
            $("#leftControl").show('fade', 1500);
            $("#rightContent").show('fade', 3500);
        } else {
            $("#leftControl").hide('fade', 2000);
            $("#rightContent").hide('fade', 2000, function () {
                destroySpace();
            });
        }
    }

    function getTicket() {
        return User.ticket;
    }

    function setTicket(ticket) {
        User.ticket = ticket;
    }

    function getTicketExpires() {
        return User.ticket_expiry;
    }

    function hasTicketExpired() {
        var future = new Number(User.ticket_expiry * 1000);
        var now = new Date().getTime();
        if (future - now >= 0) return false;
        return true;
    }

    function refreshTicket(opts) {
        var callback = opts.success;
        var errCallback = opts.error;
        new DFRequest({
            service:'User',
            resource:'/ticket',
            success:function (json) {
                var err = checkFailure(json);
                if (err) {
                    doSignIn();
                } else {
                    User.ticket = json.ticket;
                    User.ticket_expiry = json.ticket_expiry;
                    if (callback) callback(json.ticket);
                }
            },
            error:function (msg) {
                if (errCallback) {
                    errCallback(msg);
                } else {
                    throw(msg);
                }
            }
        }).retrieve();
    }

    function getCurrentTicket(opts) {
        if (hasTicketExpired()) {
            refreshTicket(opts);
        } else {
            opts.success(getTicket());
        }
    }

    function addTab(app) {
        getCurrentTicket({
            success:function (ticket) {
                var url = app.url;
                if (!(app.is_url_external)) {
                    if (url && (url.indexOf('/') > 0 || url.indexOf('/') == -1)) {
                        url = '/' + url;
                    }
                    url = getCurrentServer() + '/app/' + app.name + url;
                }
                if (url.indexOf('?') != -1) {
                    if (url.substr(-1) === "&") {
                        url += 'svr=' + escape(getCurrentServer()) + '&';
                    } else {
                        url += '&svr=' + escape(getCurrentServer()) + '&';
                    }
                } else {
                    url += '?svr=' + escape(getCurrentServer()) + '&';
                }
                url += 'app=' + escape(app.name) + '&ticket=' + escape(ticket) + '&';
                tab_content = createDisplay("disp" + app.id, url, app.description);
                addTabFunctions($tabs.tabs("add", "#tabs-" + app.id, app.label));
                $tabs.tabs("option", "selected", $('#appSelector ul a[href="#tabs-' + app.id + '"]').parent().index());
                resizeUi();
            },
            error:function (msg, faultString) {
                $('.btn' + app.id).button("option", "icons", {secondary:'ui-icon-play'});
                $().dfui('sessionExpired', faultString);
            }
        });
    }

    function makeNavButton(id, icon, label) {
        var tmpBtn = $('<button class="cTM1 appButton btn' + id + '" id="app' + id + '"></button>');
        if (label) {
            if (label.length <= max_chars_image) tmpBtn.append(icon);
            if (label.length > max_chars_button) label = label.substring(0, max_chars_button);
            label = label.replace(/ /g, '&nbsp;');
            tmpBtn.append(label);
        } else {
            tmpBtn.append(icon);
            tmpBtn.append("No Label");
        }
        return tmpBtn;
    }

    function icon(app) {
        var ico = '';
        if (app.is_url_external) {
            var appUrl = app.url;
            var tmp = appUrl.substring(appUrl.lastIndexOf('//') + 2);
            if (tmp.indexOf('/') != -1) {
                tmp = tmp.substring(0, tmp.lastIndexOf('/'));
            }
            tmp = appUrl.substring(0, appUrl.lastIndexOf('//') + 2) + tmp;
            ico = tmp + '/favicon.ico';
        } else {
            ico = getCurrentServer() + '/app/' + app.name + '/favicon.ico';
        }

        return '';//'<img src="'+ico+'" onerror="" class="cLeft" width="16" height="16" border="0"/>';
    }

    function setup() {
        var display = $("#navigation");
        for (var i in AppGrps) {
            display.append('<h3><a href="#">' + AppGrps[i].name + '</a></h3>');
            var appsList = $('<div></div>');

            var apps = getAppsFor(AppGrps[i].id);

            for (var j in apps) {
                if (apps[j].name == "LaunchPad") continue;
                appsList.append(makeNavButton(apps[j].id, icon(apps[j]), apps[j].label));
            }

            appsList.append('<br/>');
            display.append(appsList);

        }

        /* all apps group*/
        display.append('<h3><a href="#">All Applications</a></h3>');
        var appsList = $('<div></div>');
        for (var j in Apps) {
            if (Apps[j].name == "LaunchPad") continue;
            appsList.append(makeNavButton(Apps[j].id, icon(Apps[j]), Apps[j].label));
        }
        appsList.append('<br/>');
        display.append(appsList);

        display.accordion({ autoHeight:false });

        $(".appButton").button({
            text:true,
            icons:{
                secondary:'ui-icon-play'
            }
        }).click(function () {
                var appId = $(this).attr('id');

                if (appId && User) {

                    var id = appId.substring(3);

                    var app = getAppById(id);

                    if (app) {
                        if ($(this).button("option", "icons").secondary == 'ui-icon-play') {
                            $('.btn' + id).button("option", "icons", {secondary:'ui-icon-seek-next'});
                            addTab(app);
                        }
                        var xindex = 0;
                        $('[role*="tab"]').each(function () {
                            var $this = $(this);
                            var tx = $this.attr("aria-controls");
                            if (tx && tx.indexOf("tabs-") == 0) {
                                if (tx == "tabs-" + app.id) {
                                    $('#appSelector').tabs("option", "active", xindex);
                                } else {
                                    xindex++;
                                }
                            }
                        });
                    }
                }
            });
    }

    $('#UserName').keydown(function (e) {
        if (e.keyCode == 13) {
            $('#Password').focus();
        }
    });

    $('#Password').keydown(function (e) {
        if (e.keyCode == 13) {
            performSignIn();
        }
    });

    $('#loginDialog').dialog({
        resizable:false,
        modal:true,
        autoOpen:false,
        buttons:{
            "Sign In":function () {
                performSignIn();
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

                $('#app-container').empty();
                $('#app-list-container').empty();
                User = null;
                userio.post(null, null, "/Logout");
                showSignInControls(true);
                $(this).dialog("close");
                showContent(false);
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
                    userio.post(JSON.stringify(data), null, "/changepassword");
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
                User.full_name = $("#fullname").val();
                User.first_name = $("#firstname").val();
                User.last_name = $("#lastname").val();
                User.email = $("#email").val();
                User.phone = $("#phone").val();

                delete User.id;
                delete User.username;
                delete User.password;
                delete User.is_sys_admin;
                delete User.confirm_code;
                delete User.created_date;
                delete User.last_modified_date;
                delete User.created_by_id;
                delete User.last_modified_by_id;
                delete User.security_question;
                delete User.security_answer;
                delete User.role;
                delete User.ticket;
                delete User.ticket_expiry;
                delete User.session_id;

                userio.post(JSON.stringify(User), null, "/changeprofile");

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

    $("#dfSignInLink").click(function () {
        doSignIn();
    });

    destroySpace();
    userio.retrieve();

});