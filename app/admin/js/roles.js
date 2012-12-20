/**roles.js
 * 
 */

$(document).ready(function() {
	

	$(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);
	
	
	var isPageDirty = false;
	var current_roles = null;
	var selected_role = -1;
	var selected_role_id = -1;
	var selectRole = null;
	var services = [];
	var servicesLookup = {};
	var AllOption = '<option value="*">All</option>';
	
	/**
	 * Makes the Role button to select the role in the UI
	 * @param id
	 * @param name
	 * @param container
	 */
	function makeRoleButton(id,name,container) {
		container.append($('<button id="ROLE_'+id+'" class="role_button selector_btn cW100"><span id="DFRoleLabel_'+id+'">'+name+'</span></button>'));
	}
	
	/**
	 * 
	 * @param container
	 * @param roles
	 */
	function renderRoles(container,roles) {
		for(var i in roles) {
			makeRoleButton(i,roles[i].name,container);
			if(selected_role_id > -1 && parseInt(roles[i].id) == selected_role_id) {
				selected_role = i;
				selected_role_id = -1;
			}
		}
		$(".role_button").button({icons: {primary: "ui-icon-gear"}}).click(function(){
			if($(this).button( "option", "icons").secondary == undefined) {
				showRole();
				$(this).button( "option", "icons", {primary: "ui-icon-seek-next", secondary:"ui-icon-seek-next"} );
				showRole(current_roles[parseInt($(this).attr("id").substring("ROLE_".length))]);
			} else {
				showRole();
			}
		});
	}
	
	/**
	 * 
	 */
	function resetRoles() {
		if(current_roles) {
			for(var i in current_roles) {
				$('#ROLE_'+i).button( "option", "icons", {primary: "ui-icon-gear"} );
			}
		}
	}
	
	/**
	 * 
	 */
	function selectCurrentRole() {
		if(selectRole && current_roles) {
			for(var i in current_roles) {
				if(current_roles[i].name == selectRole.name) {
					$('#ROLE_'+i).button( "option", "icons", {primary: "ui-icon-seek-next", secondary:"ui-icon-seek-next"} );
					showRole(current_roles[i]);
					return;
				}
			}
		} else {
			showRole();
		}
	}
	
	/**
	 * 
	 * @param role
	 */
	function showRole(role) {
		selectRole = role;
		if(role) {
			$('#rName').val(role.name);
			$('#rDescription').val(role.description);
			$('#save').button({ disabled: true });
			$('#delete').button({ disabled: false });
			$('#clear').button({ disabled: false });
		} else {
			resetRoles();
			$('#rName').val('');
			$('#rDescription').val('');
			$('#save').button({ disabled: false });
			$('#delete').button({ disabled: true });
			$('#clear').button({ disabled: true });
		}
		$("#SELECT_ALL_APPS").prop('checked',false);
		selectApps(role);
		makeServiceList(role);
		measureScrollbars();
	}
	
	/**
	 * 
	 */
	function makeClearable() {
		$('#clear').button({ disabled: false });
		$('#save').button({ disabled: false });
	}
	
	/**
	 * The Role IO object
	 */
	var roleio = new DFRequest({
		app: 'admin',
		service: 'System',
		resource: '/role',
		type: DFRequestType.POST,
		success: function(json,request) {
			if(!parseErrors(json,errorHandler)) {
				if(request) {
					switch(request.action) {
						case DFRequestActions.UPDATE:
							$("#rolesList").dfSearchWidget('go');
							break;
						case DFRequestActions.CREATE:
							$("#rolesList").dfSearchWidget('go');
							break;
						case DFRequestActions.DELETE:
							$("#rolesList").dfSearchWidget('go');
							break;
						default:
							// maybe refresh?
							break;
					}
				}
			}
			$("#save").button({ disabled: true });
			$("#savingDialog").dialog("close");
		}
	});
	
	/**
	 * The Application IO object
	 */
	var appio = new DFRequest({
		app:  "admin",
		service: "System",
		resource: "/app",
		success: function(json) {
			if(!parseErrors(json,errorHandler)) {
				current_apps = CommonUtilities.flattenResponse(json);
				showApps(current_apps);
			}
		}
	});
	
	/**
	 * 
	 * @param confirmed
	 */
	function deleteRole(confirmed) {
		if(selectRole) {
			if(confirmed) {
				roleio.deletes(selectRole.id);
				showRole();
			} else {
				$( "#deleteRole" ).html(selectRole.name);
				$( "#confirmDeleteRoleDialog" ).dialog('open');
			}
		}
	}
	
	/**
	 * 
	 */
	function addService() {
		var index = 0;
		var id = $("#serviceId").val();
		var label = $("#serviceId option:selected").text();
		var $that = $(".SERVICE_ITEM");
		if(selectRole) {
			index = selectRole.services.length;
		} else {
			index = $that.length;
		}
		
		var exists = false;
		var psrv = $("#serviceSelect").val();
		var pcomp = $("#componentSelect").val();
		
		$that.each(function(index){
			if(!exists) {
				var $this = $(this);
				var tsrv = $("#serviceSelect_"+index).val();
				var tcomp = $("#componentSelect_"+index).val();
				if(psrv == tsrv && pcomp == tcomp) {
					exists = true;
				}
			}
		});
		
		if(!exists) {
			
			$("#SERVICE_ID_LIST").append(makeServiceComponentLine(index,{
				Service: psrv,
				Component: pcomp,
				Read:$('#Read').prop('checked')+"",
				Create:$('#Create').prop('checked')+"",
				Update:$('#Update').prop('checked')+"",
				Delete:$('#Delete').prop('checked')+""
			}));

			$("#Create_"+index).change(makeClearable);
			$("#Read_"+index).change(makeClearable);
			$("#Update_"+index).change(makeClearable);
			$("#Delete_"+index).change(makeClearable);
			
			$('#REMOVE_SRV_'+index).click(removeService);
			$("#serviceSelect").val("*").trigger("onchange");
			$('#Read').prop('checked',false);
			$('#Create').prop('checked',false);
			$('#Update').prop('checked',false);
			$('#Delete').prop('checked',false);
			
			if(selectRole) {
				processForm(selectRole);
				showRole(selectRole);
			}
	
			measureScrollbars();
			
			makeClearable();
		}
	}
	
	/**
	 * 
	 * @param apps
	 */
	function showApps(apps) {
		var con = $('#APP_ID_LIST');
		con.html('');
		for(var i in apps) {
			if(apps[i].id == undefined) continue;
			con.append('<div><input type="checkbox" name="APP_ID_'+apps[i].id+'" value="'+apps[i].id+'" class="APP_CBX"/>'+apps[i].label+'</div>');
		}
		
		$(".APP_CBX").change(makeClearable);
	}
	
	/**
	 * Select apps for this role...
	 * @param role
	 */
	function selectApps(role) {
		$(".APP_CBX").each(function(){
			$(this).prop('checked',false);
		});
		if(role && role.app_ids) {
			var tmp = role.app_ids.split(",");
			for(var i in tmp) {
				var str = $.trim(tmp[i]);
				if(str.length > 0) {
					$("input[value='"+str+"']").prop('checked',true);
				}
			}
		}
	}
	
	
	
	/**
	 * retrieve the form fields for this role
	 * @param role
	 */
	function processForm(role) {
		role.name = $('#rName').val();
		role.description = $('#rDescription').val();
		role.services = getServices();
		role.app_ids = getSelectAppIds();
	}
	
	/**
	 * 
	 * @returns {String}
	 */
	function getSelectAppIds() {
		var str = "";
		$(".APP_CBX").each(function(){
			if($(this).prop('checked')) {
				if(str.length == 0) str += ",";
				str += $(this).val();
				str += ",";
			}
		});
		return str;
	}
	
	/**
	 * Returns all services for this role as defined in the
	 * @returns {Array}
	 */
	function getServices() {
		var tmp = [];
		$(".SERVICE_ITEM").each(function(index){
			tmp[index] = {
				Service:$("#serviceSelect_"+index).val(),
				Component:$("#componentSelect_"+index).val(),
				Create:$("#Create_"+index).prop('checked')+"",
				Read:$("#Read_"+index).prop('checked')+"",
				Update:$("#Update_"+index).prop('checked')+"",
				Delete:$("#Delete_"+index).prop('checked')+""
			};
		});
		return tmp;
	}
	
	/**
	 * The Service IO object
	 */
	var serviceDescriptor = new DFRequest({
		app: 'admin',
		service: "",
		success: function(json) {
			if(services.length > 0) {
			} else {
				services = json.service;
				var selectSrv = $("#serviceSelect");
				for(var i in services) {
					var myServiceName = services[i].name;
					var myServiceLabel = services[i].label;
					servicesLookup[myServiceName] = i;
					$('<option value="'+myServiceName+'">'+myServiceLabel+'</option>').appendTo(selectSrv);
					var myDef = serviceDescriptor.prepareRequest(null,null,myServiceName);
					myDef.success = function(data) {
						if(data.resource) {
							var srv = services[servicesLookup[this.service]];
							srv.components = data.resource;
						}
					};
					serviceDescriptor.retrieve(null,null,myDef);
				}
			}
		}
	});
	
	/**
	 * 
	 * @param srv
	 */
	
	
	/**
	 * Remove service from display list...
	 */
	function removeService() {
		var $this = $(this);
		var index = $this.data("index");
		var label = $this.data("label");
		var c = confirm("Are you sure you want to remove the service '"+label+"' from the list? ");
		if(c) {
			$("#SRV_"+index).remove();
			if(selectRole) {
				processForm(selectRole);
				showRole(selectRole);
			}
			makeClearable();
		}
		
		
	}
	
	/**
	 * 
	 * @param role
	 */
	function makeServiceList(role) {
		$("#serviceSelect").val("*").trigger("onchange");
		$("#SERVICE_ID_LIST").html("");
		if(role) {
			for(var i in role.services ) {
				$("#SERVICE_ID_LIST").append(makeServiceComponentLine(i,role.services[i]));
				
				$("#Create_"+i).change(makeClearable);
				$("#Read_"+i).change(makeClearable);
				$("#Update_"+i).change(makeClearable);
				$("#Delete_"+i).change(makeClearable);
				
				$('#REMOVE_SRV_'+i).click(removeService);
			};
		}
	}
	
	/**
	 * 
	 * @param index
	 * @param service
	 * @param title
	 * @returns
	 */
	function makeCheckBox(index,service,title) {
		return $('<div class="cLeft cW25"><input type="checkbox" value="true" title="'+title+'" id="'+title+'_'+index+'" '+(service[title] == "true"?"CHECKED":"")+'/></div>');
	}
	
	/**
	 * 
	 * @param index
	 * @param service
	 * @returns
	 */
	function makeServiceComponentLine(index,service) {
		
		// create major elements...
		var line = $('<div id="SRV_'+index+'" data-index="'+index+'" class="SERVICE_ITEM cBM1"/>');
		var fcolumn = $('<div class="cLeft cW30"/>');
		var scolumn = $('<div class="cLeft cW30 cLM1"/>');
		var tcolumn = $('<div class="cLeft cW30" align="center"/>');
		var srvSelect = $('<select id="serviceSelect_'+index+'" data-index="'+index+'" class="cW100" onchange="doListSelect(this);makeClearable()"/>');
		var compSelect = $('<select id="componentSelect_'+index+'" data-index="'+index+'" class="cW100" onchange="makeClearable()">');
		
		fcolumn.appendTo(line);
		scolumn.appendTo(line);
		tcolumn.appendTo(line);
		srvSelect.appendTo(fcolumn);
		compSelect.appendTo(scolumn);
		
		
		// create default options...
		$(AllOption).appendTo(srvSelect);
		$(AllOption).appendTo(compSelect);
		
		var selected = false;
		
		// iterate over services and their compoenents...
		for(var i in services) {
			selected = service.Service == services[i].name;
			$('<option value="'+services[i].name+'" '+(selected?"SELECTED":"")+'>'+services[i].label+'</option>').appendTo(srvSelect);
			if(selected) {
				for(var j in services[i].components) {
					$('<option value="'+services[i].components[j].name+'" '+(service.Component == services[i].components[j].name?"SELECTED":"")+'>'+services[i].components[j].name+'</option>').appendTo(compSelect);
				}
			}
		}
		
		// check box elements...
		makeCheckBox(index,service,"Create").appendTo(tcolumn);
		makeCheckBox(index,service,"Read").appendTo(tcolumn);
		makeCheckBox(index,service,"Update").appendTo(tcolumn);
		makeCheckBox(index,service,"Delete").appendTo(tcolumn);
		
		$('<span class="ui-state-df-red"><span class="ui-icon ui-icon-closethick offTop3 cLM1" data-label="'+service.Service+'" data-index="'+index+'" id="REMOVE_SRV_'+index+'" title="Remove From List"></span></span>').appendTo(line);
		$('<div class="cClear"><!--  --></div>').appendTo(tcolumn);
		$('<div class="cClear"><!--  --></div>').appendTo(line);
		
		return line;
	}
	
	function measureScrollbars() {
		$("#ServicesHeaders").css("width",$("#SERVICE_ID_LIST").width());
		$("#ServicesWidgets").css("width",$("#SERVICE_ID_LIST").width());
	}
	
	$(window).bind('resize', function() {
		measureScrollbars();
	});

	makeAdminNav('roles');
	appio.retrieve();
	
	$(".ONKEYUP").keyup(makeClearable);
	$(".ONCHANGE").change(makeClearable);
	$(".APP_SELECT_ALL").change(function(){
		var select = $(this).prop('checked');
		$(".APP_CBX").each(function(){
			$(this).prop('checked',select);
		});
	});
	
	$("#serviceSelect").change(function(srv) {
		var $this = $(this);
		var index = parseInt($this.data("index"));
		var srv = services[servicesLookup[$this.val()]];
		if(index < 0) {
			index = "";
		} else {
			index = "_"+index;
		}
		var $that = $("#componentSelect"+index);
		$that.html(AllOption);
		if(srv) {
			for(var i in srv.components) {
				$('<option value="'+srv.components[i].name+'">'+srv.components[i].name+'</option>').appendTo($that);
			}
		}
	});
	
	$("#delete").button({icons: {primary: "ui-icon-trash"}}).click(function(){
		deleteRole();
	});
	
	$("#save").button({icons: {primary: "ui-icon-disk"}}).click(function(){
		if(selectRole) {
			processForm(selectRole);
			delete selectRole.created_by_id;
			delete selectRole.created_date;
			delete selectRole.last_modified_by_id;
			delete selectRole.last_modified_date;
			roleio.update(selectRole);
		} else {
			var role = {};
			processForm(role);
			roleio.create(role);
			selectRole = role;
		}
	});
	
	$("#clear").button({icons: {primary: "ui-icon-document"}}).click(function(){
		showRole();
	});
	
	$("#addService").button({text:false,icons: {primary: "ui-icon-plusthick"}}).click(addService);
	
	$( "#confirmDeleteRoleDialog" ).dialog({
		resizable: false,
		modal: true,
		autoOpen: false,
		buttons: {
			Continue: function() {
				deleteRole(true);
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
	
	$("#rolesList").dfSearchWidget({
		app: "admin",
		service: "System",
		resource: "/role",
		offsetHeight: 25,
		noSearchTerm: true,
		renderer: function(container,roles) {
			if(roles.length > 0) {
				current_roles = roles;
				renderRoles(container,roles);
				resizeUi();
				selectCurrentRole();
				return roles.length;
			} else {
				renderRoles(container,roles);
				container.append("<i>End Of List</i>");
				resizeUi();
				return 0;
			}
		}
	});
	
	serviceDescriptor.retrieve({order:"label"});
	
});
