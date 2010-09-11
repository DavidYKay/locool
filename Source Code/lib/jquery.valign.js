(function ($) 
// VERTICALLY ALIGN FUNCTION
$.fn.vAlign = function() 
	return this.each(function() {
		var ah = $(this).height();
		var ph = $(this).parent().height();
		var mh = (ph – ah) / 2;
		$(this).css('margin-top', mh);
	});
;
)(jQuery);
