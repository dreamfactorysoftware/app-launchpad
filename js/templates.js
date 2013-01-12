/**
 * Created with JetBrains PhpStorm.
 * User: jasonsykes
 * Date: 1/7/13
 * Time: 11:37 AM
 * To change this template use File | Settings | File Templates.
 */
Templates = function () {
    this.thumbPanel = "<h1>{{name}}</h1><br/>{{desc}}";
    this.alertMessage = '<div class="alert">' +
        '<a class="close" data-dismiss="alert">x</a>' +
        '{{message}}' +
        '</div>';
    this.gridTemplate = '<table id="db-tables" class="table table-bordered table-striped">' +
        '<thead>' +
        '<tr>' +
        '<th class="table-names-header">Table Name</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '{{#table}}' +
        '<tr>' +
        '<td onclick = "Actions.loadSchema(\'{{name}}\')")>{{name}}</td>' +
        '</tr> ' +
        '{{/table}}' +
        '</tbody>' +
        '</table>';
    this.AppListTemplate = '<table id="db-tables" class="table table-bordered table-striped">' +
        '<thead>' +
        '<tr>' +
        '<th class="table-names-header">Table Name</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '{{#table}}' +
        '<tr>' +
        '<td onclick = "Actions.loadSchema(\'{{name}}\')")>{{name}}</td>' +
        '</tr> ' +
        '{{/table}}' +
        '</tbody>' +
        '</table>';
    this.loadTemplate = function (template, data, renderTo) {
        var processTpl;
        processTpl = Mustache.to_html(template, data);
        document.getElementById(renderTo).innerHTML = processTpl;

    }
};






