$(document).ready(function(){
	$('#ss-form').submit(function() {
		var eml = $('#entry_0').val();
		alert('We will drop you a line at ' + eml + ' when the beta is ready!');
		return true;
	});
});
