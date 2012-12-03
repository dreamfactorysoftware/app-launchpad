
/**
 * 
 * @param data
 * @param success
 * @param error
 */
function parseErrors(data,error) {
	if(!(data instanceof String)) {
		if(data.records) data = data.records;
		if(data.record) {
			var errs = makeForFaults(data.record);
			if(errs.length > 0) {
				error(errs,data);
				return true;
			}
		} else if(data.file || data.folder) {
			var errs = makeForFaults(data.folder);
			makeForFaults(data.file,errs);
			if(errs.length > 0) {
				error(errs,data);
				return true;
			}
		} else if(data.fault) {
			error([makeErrorReport(data.fault)],data);
			return true;
		}
	}
}

/**
 * 
 * @param data
 * @returns {Array}
 */
function makeForFaults(data,errs) {
	if(!errs) errs = [];
	for(var i in data) {
		if(data[i].fault) {
			errs[errs.length] = makeErrorReport(data[i].fault);
		}
	}
	return errs;
}

/**
 * 
 * @param json
 * @returns {String}
 */
function makeErrorReport(json) {
	var str = "";
	
	if(json.faultCode) {
		str += json.faultCode+": ";
	}

	if(json.faultString) {
		str += json.faultString;
	}
	
	return str;
}
