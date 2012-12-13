/**
 * apps.js
 */

function makeClearable() {
	$('#clear').button({ disabled: false });
	$("#save").button({ disabled: false });
}

$(document).ready(function() {
		
	var isPageDirty = false;
	var selected_app_id = -1;
	var current_apps = null;
	var selectApp = null;
	var reselectApp = false;
	
	/**
	 * 
	 * @param id
	 * @param name
	 * @param container
	 */
	function makeAppButton(id,name,container) {
		container.append($('<button id="APP_'+id+'" class="app_button selector_btn cW100"><span id="DFUserLabel_'+id+'">'+name+'</span></button>'));
	}
	
	/**
	 * 
	 * @param container
	 * @param apps
	 */
	function renderApps(container,apps) {
		for(var i = 0; i < apps.length; i++) {
			if(!apps[i]) continue;
			makeAppButton(i,apps[i].Label,container);
			if(selected_app_id > -1 && parseInt(apps[i].Id) == selected_app_id) {
				selected_user = i;
				selected_app_id = -1;
			}
		}
		$('.app_button').button({icons: {primary: "ui-icon-star"}}).click(function(){
			showApp(null); // clear user selection
			$(this).button( "option", "icons", {primary: 'ui-icon-seek-next', secondary:'ui-icon-seek-next'} );
			showApp(current_apps[parseInt($(this).attr('id').substring('APP_'.length))]);
		});
	}
	
	/**
	 * 
	 */
	function selectCurrentApp() {
		if(selectApp && current_apps) {
			for(var i in current_apps) {
				if(current_apps[i].Name == selectApp) {
					$('#APP_'+i).button( "option", "icons", {primary: "ui-icon-seek-next", secondary:"ui-icon-seek-next"} );
					showApp(current_apps[i]);
					return;
				}
			}
		} else {
			showApp();
		}
	}
	/**
	 * 
	 * @param app
	 */
	function showApp(app) {
		
		if(selectApp && app == null && reselectApp) {
			reselectApp = false;
			app = selectApp;
		} else {
			selectApp = app;
		}
		
		if(app) {
			$('input:text[name=Name]').val(app.Name);
			$('input:text[name=Label]').val(app.Label);
			$('input:text[name=Description]').val(app.Description);
			$('input:text[name=Url]').val(app.Url);
			if(app.IsActive == "true") {
				$('input[name="IsActive"]')[0].checked = true;
			} else {
				$('input[name="IsActive"]')[1].checked = true;
			}
			if(app.IsUrlExternal == "true") {
				$('input[name="IsUrlExternal"]')[0].checked = true;
			} else {
				$('input[name="IsUrlExternal"]')[1].checked = true;
			}
			$("#save").button({ disabled: true });
			if(app.IsUrlExternal == "true") {
				$("#filemanager").button({ disabled: true });
			} else {
				$("#filemanager").button({ disabled: false });
			}
			hideImport();
			$("#export").button({ disabled: false });
			$('#delete').button({ disabled: false });
			$('#clear').button({ disabled: false });
			
			$("#cell").prop('checked',app.cell=="true");
			$("#tablet").prop('checked',app.tablet=="true");
			$("#desktop").prop('checked',app.desktop=="true");
			
		} else {
			if(current_apps) {
				for(var i in current_apps) {
					$('#APP_'+i).button( "option", "icons", {primary: 'ui-icon-star', secondary:''} );
				}
			}
			$('input:text[name=Name]').val('');
			$('input:text[name=Label]').val('');
			$('input:text[name=Description]').val('');
			$('input:text[name=Url]').val('');
			$('input[name="IsActive"]')[1].checked = true;
			$('input[name="IsUrlExternal"]')[1].checked = true;
			$('#save').button({ disabled: false });
			showImport();
			$("#filemanager").button({ disabled: true });
			$("#export").button({ disabled: true });
			$('#delete').button({ disabled: true });
			$('#clear').button({ disabled: true });
			

			$("#cell").prop('checked',false);
			$("#tablet").prop('checked',false);
			$("#desktop").prop('checked',false);
		}
		
		selectSchemas(app);
	}
	
	/**
	 * 
	 */
	var appio = new DFRequest({
		app: "admin",
		service: "System",
		resource: "/App",
		success: function(json,request) {
			if(!parseErrors(json,errorHandler)) {
				if(request) {
					switch(request.action) {
						case DFRequestActions.UPDATE:
							$("#appsList").dfSearchWidget('go');
							updateLaunchPad("Do you want to update LaunchPad now with the changes?");
							break;
						case DFRequestActions.CREATE:
							$("#appsList").dfSearchWidget('go');
							updateLaunchPad("Do you want to update LaunchPad now with the new Application?");
							break;
						case DFRequestActions.DELETE:
							$("#appsList").dfSearchWidget('go');
							updateLaunchPad("Do you want to update LaunchPad now without the Application?");
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
	 * 
	 * @param confirmed
	 */
	function deleteApp(confirmed) {
		if(selectApp) {
			if(confirmed) {
				appio.deletes(selectApp.Id);
				showApp();
			} else {
				$( "#deleteApp" ).html(selectApp.Label);
				$( "#confirmDeleteAppDialog" ).dialog('open');
			}
		}
	}
	
	/**
	 * 
	 * @param app
	 */
	function getForm(app) {
		app.Name = $('input:text[name=Name]').val();
		app.Label = $('input:text[name=Label]').val();
		app.Description = $('input:text[name=Description]').val();
		app.Url = $('input:text[name=Url]').val();
		
		if($('input[name="IsActive"]')[0].checked) {
			app.IsActive = "true";
		} else {
			app.IsActive = "false";
		}
		if($('input[name="IsUrlExternal"]')[0].checked) {
			app.IsUrlExternal = "true";
		} else {
			app.IsUrlExternal = "false";
		}
		
		if($("#cell").prop('checked')) {
			app.cell = "true";
		} else {
			app.cell = "false";
		}

		if($("#tablet").prop('checked')) {
			app.tablet = "true";
		} else {
			app.tablet = "false";
		}

		if($("#desktop").prop('checked')) {
			app.desktop = "true";
		} else {
			app.desktop = "false";
		}
		
		app.Schemas = getSelectSchemas();
	}
	
	/**
	 * 
	 */
	function showImport() {
		$("#fileManagement").show();
	}
	
	/**
	 * 
	 */
	function hideImport() {
		$("#fileManagement").hide();
	}
	
	function selectSchemas(app) {
		$("#SELECT_ALL_SCHEMAS").prop('checked',false);
		$(".SCHEMA_CBX").each(function(){
			$(this).prop('checked',false);
		});
		if(app && app.Schemas) {
			var tmp = app.Schemas.split(",");
			for(var i in tmp) {
				var str = $.trim(tmp[i]);
				if(str.length > 0) {
					$("input[value='"+str+"']").prop('checked',true);
				}
			}
		}
	}
	
	
	function getSelectSchemas() {
		var str = "";
		$(".SCHEMA_CBX").each(function(){
			if($(this).prop('checked')) {
				if(str.length > 0) str += ",";
				str += $(this).val();
			}
		});
		return str;
	}
	
	function showSchemas(schema) {
		var con = $('#SCHEMA_ID_LIST');
		con.html('');
		for(var i in schema) {
			con.append('<div><input type="checkbox" name="SCHEMA_ID_'+schema[i].name+'" value="'+schema[i].name+'" class="SCHEMA_CBX" onchange="makeClearable()"/>'+schema[i].label+'</div>');
		}
	}
	
	/**
	 * The Role IO object
	 */
	var schemas = new DFRequest({
		app: "admin",
		service: "DB",
		resource: "/Schema",
		type: DFRequestType.POST,
		success: function(json,request) {
			if(!parseErrors(json,errorHandler)) {
				showSchemas(json.table);
			}
		}
	});

	makeAdminNav('apps');
	
	schemas.retrieve();
	
	if(CommonUtilities.getQueryParameter('selectedApp')) {
		reselectApp = true;
	}
	
	$("#import").button({icons: {primary: "ui-icon-circle-arrow-n"}}).click(function(){
		$("#uploadFileInput").trigger("click");
	});
	
	$("#export").button({icons: {primary: "ui-icon-circle-arrow-s"}}).click(function(){
		$("#uploadFileIframe").attr("src","/REST/admin/APP/"+selectApp.Name+"/?export=true&");
	});
	
	$("#delete").button({icons: {primary: "ui-icon-trash"}}).click(function(){
		deleteApp();
	});
	
	$("#save").button({icons: {primary: "ui-icon-disk"}}).click(function(){
		if(selectApp) {
			getForm(selectApp);
			var t = selectApp.Name;
			delete selectApp.Name;
			delete selectApp.CreatedById;
			delete selectApp.CreatedDate;
			delete selectApp.LastModifiedById;
			delete selectApp.LastModifiedDate;
			appio.update(selectApp);
			selectApp = t;
		} else {
			var app = {};
			getForm(app);
			appio.create(app);
			selectApp = app.Name;
		}
	});
	
	$("#clear").button({icons: {primary: "ui-icon-document"}}).click(function(){
		showApp();
	});
	
	$("#filemanager").button({icons: {primary: "ui-icon-folder-collapsed"}}).click(function(){
		window.location = ('../filemanager/index.html?hostApp=admin&path='+selectApp.Name+'&returnUrl='+escape(window.location.href.substring(0,window.location.href.indexOf('?'))+'?selectedApp='+selectApp.Name));
	});
	
	$( "#confirmDeleteAppDialog" ).dialog({
		resizable: false,
		modal: true,
		autoOpen: false,
		buttons: {
			Continue: function() {
				deleteApp(true);
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});

	$(".ONKEYUP").keyup(makeClearable);
	$(".ONCHANGE").change(makeClearable);
	$(".SCHEMA_SELECT_ALL").change(function() {
		var select = $(this).prop('checked');
		$(".SCHEMA_CBX").each(function(){
			$(this).prop('checked',select);
		});
		makeClearable();
	});
	$("#uploadFileIframe").load(function() {
		var that = $(this);
		var str = that.contents().text();
		if(str && str.length > 0) {
			try {
				str = JSON.parse(str);
				var result = parseErrors(str,errorHandler);
				appio.retrieve();
			} catch (e) {
				alert(e);
			}
		}
	});
	
	$("#appsList").dfSearchWidget({
		app: 'admin',
		service: "System",
		resource: '/App',
		offsetHeight: 25,
		noSearchTerm: true,
		renderer: function(container,apps) {
			for(var i in apps) {
				if(reselectApp && apps[i].Name == CommonUtilities.getQueryParameter('selectedApp')) {
					selectApp = apps[i];
				}
			}
			if(apps.length > 0) {
				current_apps = apps;
				renderApps(container,apps);
				resizeUi();
				selectCurrentApp();
				return apps.length;
			} else {
				renderApps(container,users);
				container.append('<i>End Of List</i>');
				resizeUi();
				showApp();
				return 0;
			}
		}
	});
	
});