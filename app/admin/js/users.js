/**
 * users.js
 */


$(document).ready(function() {
	
	var isPageDirty = false;
	var selected_user_id = -1;
	var current_users = null;
	var selectUser = null;
	
	/**
	 * 
	 * @param id
	 * @param name
	 * @param container
	 */
	function makeUserButton(id,name,container) {
		container.append($('<button id="USER_'+id+'" class="user_button selector_btn cW100"><span id="DFUserLabel_'+id+'">'+name+'</span></button>'));
	}
	
	/**
	 * 
	 * @param container
	 * @param users
	 */
	function renderUsers(container,users) {
		for(var i = 0; i < users.length; i++) {
			if(!users[i]) continue;
			makeUserButton(i,users[i].full_name,container);
			if(selected_user_id > -1 && parseInt(users[i].Id) == selected_user_id) {
				selected_user = i;
				selected_user_id = -1;
			}
		}
		$('.user_button').button({icons: {primary: "ui-icon-person"}}).click(function(){
			showUser(); // clear user selection
			$(this).button( "option", "icons", {primary: 'ui-icon-seek-next', secondary:'ui-icon-seek-next'} );
			showUser(current_users[parseInt($(this).attr('id').substring('USER_'.length))]);
		});
	}
	
	/**
	 * 
	 */
	function selectCurrentUser() {
		if(selectUser && current_users) {
			for(var i in current_users) {
				if(current_users[i].full_name == selectUser.full_name && current_users[i].last_name == selectUser.last_name && current_users[i].first_name == selectUser.first_name) {
					$('#USER_'+i).button( "option", "icons", {primary: 'ui-icon-seek-next', secondary:'ui-icon-seek-next'} );
					showUser(current_users[i]);
					return;
				}
			}
		} else {
			showUser();
		}
	}
	
	/**
	 * 
	 * @param user
	 */
	function showUser(user) {
		selectUser = user;
		if(user) {
			$('input:text[name=username]').val(user.username);
			$('input:text[name=fullname]').val(user.full_name);
			$('input:text[name=lastname]').val(user.last_name);
			$('input:text[name=firstname]').val(user.first_name);
			$('input:text[name=email]').val(user.email);
			$('input:text[name=phone]').val(user.phone);
			if(user.is_active == 'true') {
				$('input[name="isactive"]')[0].checked = true;
			} else {
				$('input[name="isactive"]')[1].checked = true;
			}
			
			if(user.is_sys_admin == 'true') {
				$("#roleSelector").val("*");
			} else {
				$("#roleSelector").val(user.role_id);
			}
			
			$("#save").button({ disabled: true });
			$('#delete').button({ disabled: false });
			$('#clear').button({ disabled: false });
		} else {
			if(current_users) {
				for(var i in current_users) {
					$('#USER_'+i).button( "option", "icons", {primary: 'ui-icon-person', secondary:''} );
				}
			}
			$('input:text[name=username]').val('');
			$('#Password').val("");
			$('#VPassword').val("");
			$('input:text[name=fullname]').val('');
			$('input:text[name=lastname]').val('');
			$('input:text[name=firstname]').val('');
			$('input:text[name=email]').val('');
			$('input:text[name=phone]').val('');
			$('input[name="isactive"]')[1].checked = true;
			
			$("#roleSelector").val("");
			
			$('#save').button({ disabled: false });
			$('#delete').button({ disabled: true });
			$('#clear').button({ disabled: true });
			
			$("#Password").removeClass("RedBorder");
			$("#Password").removeClass("GreenBorder");
			$("#VPassword").removeClass("RedBorder");
			$("#VPassword").removeClass("GreenBorder");
		}
	}
	
	/**
	 * 
	 */
	function makeClearable() {
		$('#clear').button({ disabled: false });
		$("#save").button({ disabled: false });
	}
	
	/**
	 * 
	 */
	var dfio = new DFRequest({
		app: "admin",
		service: "System",
		resource: "/user",
		type: DFRequestType.POST,
		success: function(json,request) {
			if(!parseErrors(json,errorHandler)) {
				if(request) {
					switch(request.action) {
						case DFRequestActions.UPDATE:
							$('#usersList').dfSearchWidget("refresh");
							break;
						case DFRequestActions.CREATE:
							var userReturn = CommonUtilities.flattenResponse(json);
							if(userReturn.length > 0) {
								if(userReturn[0].id) {
									selectUser.id = userReturn[0].id;
								}
							}
							current_users.splice(0, 0, selectUser);
							$('#usersList').dfSearchWidget("refresh");
							break;
						case DFRequestActions.DELETE:
							for(var i in current_users) {
								if(current_users[i].id == selectUser.id) {
									current_users.splice(i,1);
									$("#usersList").dfSearchWidget("refresh");
									break;
								}
							}
							showUser();
							break;
						default:
							// maybe refresh?
							break;
					}
				}
			}
			$("#save").button({ disabled: true });
		}
	});
	
	/**
	 * The Role IO object
	 */
	var roleio = new DFRequest({
		app: 'admin',
		service: 'System',
		resource: '/role',
		type: DFRequestType.POST,
		params: {fields: "id,name"},
		success: function(json,request) {
			if(!parseErrors(json,errorHandler)) {
				if(request) {
					var roles = CommonUtilities.flattenResponse(json);
					var rs = $("#roleSelector");
					rs.html($("<option/>").attr("value","").text("[ No Role Selected ]"));
					rs.append($("<option/>").attr("value","*").text("System Administrator"));
					for(var i in roles) {
						rs.append($("<option/>").attr("value",roles[i].id).text(roles[i].name));
					}
				}
			}
		}
	});
	
	/**
	 * 
	 * @param obj
	 */
	function pullFormData(obj) {
		obj.username  = $('input:text[name=username]').val();
		
		var pword = $.trim($('#Password').val());
		var vword = $.trim($('#VPassword').val());
		
		if(pword && pword == vword) {
			obj.Password = pword;
		} else if(pword && pword != vword) {
			throw "Passwords do not match! Password and Verify Password must match before you may proceed.";
		}
		
		$('#Password').val("").trigger("keyup");
		$('#VPassword').val("").trigger("keyup");
		
		obj.full_name  = $('input:text[name=fullname]').val();
		obj.last_name  = $('input:text[name=lastname]').val();
		obj.first_name = $('input:text[name=firstname]').val();
		obj.email     = $('input:text[name=email]').val();
		obj.phone     = $('input:text[name=phone]').val();
		
		if($('input[name="isactive"]')[1].checked) {
			obj.is_active = 'false';
		} else {
			obj.is_active = 'true';
		}
		
		var roleId = $("#roleSelector").val();
		
		if(roleId == "*") {
			obj.is_sys_admin = 'true';
			obj.role_id = null;
		} else {
			obj.is_sys_admin = 'false';
			obj.role_id = roleId;
		}
		
	}
	
	/**
	 * 
	 */
	function deleteUser(confirmed) {
		if(selectUser) {
			if(confirmed) {
				dfio.deletes(selectUser.id);
			} else {
				$( "#deleteUser" ).html(selectUser.full_name);
				$( "#confirmDeleteUserDialog" ).dialog('open');
			}
		}
	}
	
	$(".ONKEYUP").keyup(makeClearable);
	$(".ONCHANGE").change(makeClearable);
	
	//$(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);
	
	makeAdminNav('index');
	
	roleio.retrieve();
	
	$("#delete").button({icons: {primary: "ui-icon-trash"}}).click(function(){
		deleteUser();
	});
	
	$("#save").button({icons: {primary: "ui-icon-disk"}}).click(function(){
		try {
			if(selectUser) {
				pullFormData(selectUser);
				delete selectUser.created_by_id;
				delete selectUser.created_date;
				delete selectUser.last_modified_by_id;
				delete selectUser.last_modified_date;
				dfio.update(selectUser);
			} else {
				var user = {};
				pullFormData(user);
				dfio.create(user);
				selectUser = user;
			}
		} catch (e) {
			alert(e);
		}
	});
	
	$("#clear").button({icons: {primary: "ui-icon-document"}}).click(function(){
		showUser();
	});
	
	$( "#confirmDeleteUserDialog" ).dialog({
		resizable: false,
		modal: true,
		autoOpen: false,
		buttons: {
			Continue: function() {
				deleteUser(true);
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
	
	$("#usersList").dfSearchWidget({
		app: "admin",
		service: "System",
		resource: "/user",
		offsetHeight: 25,
		filter: function(name,val){
			if(!name) name = "full_name";
			return {
				filter: name+" LIKE '%"+val+"%'"
			};
		},
		orderBy: [
			{
				label: "[Sort By]",
				value: "id"
			},
			{
				label: "First Name",
				value: "first_name"
			},
			{
				label: "Last Name",
				value: "last_name"
			},
			{
				label: "Last Modified",
				value: "LastModifiedDate"
			}
		],
		renderer: function(container,users) {
			if(users.length > 0) {
				current_users = users;
				renderUsers(container,users);
				container.append($('<div style="height:8px;"></div>'));
				resizeUi();
				selectCurrentUser();
				return users.length;
			} else {
				renderUsers(container,users);
				container.append("<div align='center'>&lt;<i>No results for search term... Please Try Again!</i>&gt;</div>");
				resizeUi();
				showUser();
				return 0;
			}
		}
	});
	
	function doPasswordVerify() {
		var value = $("#Password").val();
		var verify = $("#VPassword").val();
		if(value.length > 0 && verify.length > 0) {
			if(value == verify) {
				$("#Password").removeClass("RedBorder");
				$("#Password").addClass("GreenBorder");
				$("#VPassword").removeClass("RedBorder");
				$("#VPassword").addClass("GreenBorder");
			} else {
				$("#Password").removeClass("GreenBorder");
				$("#Password").addClass("RedBorder");
				$("#VPassword").removeClass("GreenBorder");
				$("#VPassword").addClass("RedBorder");
			}
		} else {
			$("#Password").removeClass("RedBorder");
			$("#Password").removeClass("GreenBorder");
			$("#VPassword").removeClass("RedBorder");
			$("#VPassword").removeClass("GreenBorder");
		}
	}
	
	$("#Password").keyup(doPasswordVerify);
	$("#VPassword").keyup(doPasswordVerify);
	
	
});