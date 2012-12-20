/**
 * services.js
 */
var isPageDirty = false;
var selected_service_id = -1;
var current_service = null;
var selectService = null;

/**
 * 
 * @param id
 * @param name
 * @param container
 */
function makeServiceButton(id,name,container) {
	container.append($('<button id="SERV_'+id+'" class="service_button selector_btn cW100"><span id="DFServiceLabel_'+id+'">'+name+'</span></button>'));
}

/**
 * 
 * @param container
 * @param services
 */
function renderServices(container,services) {
	for(var i = 0; i < services.length; i++) {
		if(!services[i]) continue;
		makeServiceButton(i,services[i].label,container);
		if(selected_service_id > -1 && parseInt(services[i].Id) == selected_service_id) {
			selected_user = i;
			selected_service_id = -1;
		}
	}
	$('.service_button').button({icons: {primary: "ui-icon-star"}}).click(function(){
		showService(null); // clear user selection
		$(this).button( "option", "icons", {primary: 'ui-icon-seek-next', secondary:'ui-icon-seek-next'} );
		showService(current_service[parseInt($(this).attr('id').substring('SERV_'.length))]);
	});
}

/**
 * 
 */
function selectCurrentService() {
	if(selectService && current_service) {
		for(var i in current_service) {
			if(current_service[i].name == selectService.name) {
				$('#SERV_'+i).button( "option", "icons", {primary: "ui-icon-seek-next", secondary:"ui-icon-seek-next"} );
				showService(current_service[i]);
				return;
			}
		}
	} else {
		showService();
	}
}

/**
 * 
 * @param service
 */
function showService(service) {
	selectService = service;
	if(service) {
		$('input:text[name=Name]').val(service.name);
		$('input:text[name=Label]').val(service.label);
		if(service.is_active == 'true') {
			$('input[name="IsActive"]')[0].checked = true;
		} else {
			$('input[name="IsActive"]')[1].checked = true;
		}
		
		$("#serviceType").val(service.type);
		$("#serviceType").trigger('change');
		
		$('input:text[name=BaseUrl]').val(service.base_url);
		$('#HeaderList').val(service.headers);
		$('#ParamList').val(service.parameters);
		//$('#active').buttonset('refresh');
		$("#save").button({ disabled: true });
	} else {
		if(current_service) {
			for(var i in current_service) {
				$('#SERV_'+i).button( "option", "icons", {primary: 'ui-icon-star', secondary:''} );
			}
		}
		$('input:text[name=Name]').val('');
		$('input:text[name=Label]').val('');
		
		$("#serviceType").val('');
		$("#serviceType").trigger('change');
		
		$('input:text[name=BaseUrl]').val('');
		$('#HeaderList').val('');
		$('#ParamList').val('');
		$('input[name="IsActive"]')[0].checked = true;
		//$('#active').buttonset('refresh');
		$('#save').button({ disabled: false });
	}
	if(service) {
		$('#delete').button({ disabled: false });
		$('#clear').button({ disabled: false });
	} else {
		$('#delete').button({ disabled: true });
		$('#clear').button({ disabled: true });
	}
	
}

/**
 * 
 */
function makeClearable() {
	$('#clear').button({ disabled: false });
	$("#save").button({ disabled: false });
}

var serviceio = new DFRequest({
	app: 'admin',
	service: "System",
	resource: '/Service',
	type: DFRequestType.POST,
	success: function(json,request) {
		if(!parseErrors(json,errorHandler)) {
			if(request) {
				switch(request.action) {
					case DFRequestActions.UPDATE:
						$("#serviceList").dfSearchWidget('go');
						break;
					case DFRequestActions.CREATE:
						$("#serviceList").dfSearchWidget('go');
						break;
					case DFRequestActions.DELETE:
						$("#serviceList").dfSearchWidget('go');
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
function deleteService(confirmed) {
	if(selectService) {
		if(confirmed) {
			serviceio.deletes(selectService.Id);
			showService();
		} else {
			$( "#deleteService" ).html(selectService.label);
			$( "#confirmDeleteUserDialog" ).dialog('open');
		}
	}
}

/**
 * 
 * @param ws
 */
function getForm(ws) {
	ws.name = $('input:text[name=Name]').val();
	ws.label = $('input:text[name=Label]').val();
	ws.type = $("#serviceType").val();
	ws.base_url = $('input:text[name=BaseUrl]').val();
	ws.headers = $('#HeaderList').val();
	ws.parameters = $('#ParamList').val();
	ws.is_active = !$('input[name="IsActive"]')[1].checked;
}

$(document).ready(function() {
	
	//$(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);
	
	makeAdminNav('services');
	
	$("#delete").button({icons: {primary: "ui-icon-trash"}}).click(function(){
		deleteService();
	});
	
	$("#save").button({icons: {primary: "ui-icon-disk"}}).click(function(){
		if(selectService) {
			getForm(selectService);
			delete selectService.created_by_id;
			delete selectService.created_date;
			delete selectService.last_modified_by_id;
			delete selectService.last_modified_date;
			serviceio.update(selectService);
		} else {
			var service = {};
			getForm(service);
			serviceio.create(service);
			selectService = service;
			selectService = service;
		}
	});
	
	$("#clear").button({icons: {primary: "ui-icon-document"}}).click(function(){
		showService();
	});
	
	$( "#confirmDeleteUserDialog" ).dialog({
		resizable: false,
		modal: true,
		autoOpen: false,
		buttons: {
			Continue: function() {
				deleteService(true);
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
	
	$("#WebOptions").hide();
	
	$('#serviceType').change(function(){
		switch($(this).val()) {
			case 'Native':
				$("#WebOptions").hide();
				break;
			case 'Managed':
				$("#WebOptions").hide();
				break;
			case 'Web':
				$("#WebOptions").show();
				break;
			default:
				$("#WebOptions").hide();
				break;
		}
	});

	$("#serviceList").dfSearchWidget({
		app: "admin",
		service: "System",
		resource: "/service",
		offsetHeight: 25,
		noSearchTerm: true,
		renderer: function(container,services) {
			if(services.length > 0) {
				current_service = services;
				renderServices(container,services);
				resizeUi();
				selectCurrentService();
				return services.length;
			} else {
				renderServices(container,services);
				container.append("<i>End Of List</i>");
				resizeUi();
				showService();
				return 0;
			}
		}
	});
});