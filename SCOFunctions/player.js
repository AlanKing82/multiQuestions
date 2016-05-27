// $Rev: 6141 $ $Date: 2014-09-03 12:26:38 +0100 (Wed, 03 Sep 2014) $ $Author: jan $
/**
 *  CDT playe javascript library 
 */

//vertical aligment solution from: http://www.alistapart.com/d/footers/footer_variation1.html
function getWindowHeight() {
	var windowHeight = 0;
	if (typeof(window.innerHeight) == 'number') {
	   windowHeight = window.innerHeight;
	}
	else {
	   if (document.documentElement && document.documentElement.clientHeight) {
	       windowHeight = document.documentElement.clientHeight;
	   }
	   else {
	       if (document.body && document.body.clientHeight) {
	           windowHeight = document.body.clientHeight;
	       }
	   }
	}
	return windowHeight;
}
/* DEPRECATED as causing issues on mobile devices */
function setContent() {
	if (document.getElementById) {
	   var windowHeight = getWindowHeight();
	   if (windowHeight > 0) {
	       var contentElement = document.getElementById('container');
	       var contentHeight = contentElement.offsetHeight;
	       if (windowHeight - contentHeight > 0) {
	           contentElement.style.position = 'relative';
	           contentElement.style.top = ((windowHeight / 2) - (contentHeight / 2)) + 'px';
	       }
	   }
	}
}
//END vertical aligment solution

// shrink too long module titles
function shrinkLessonTitles()
{
	$( 'a.menuItem span' ).each(function( index, el ){
		var MAX_LABEL = 35;
	    var jThis = $(this);
		var label = jThis.text();
		var cutLabelOff = label.length > MAX_LABEL; 
		
		// replace last 3 characters with '...'
		if( jThis.width() > 133 || cutLabelOff )
		{
		    // cut it to prevent processing too many many times
		    // in the 'while' loop
			if( cutLabelOff )
			    label = label.substr( 0, MAX_LABEL )
		    
		    label = label.slice( 0, -3 ) + '...';
			jThis.html( label );
		}

		// keep removing one letter until we got max size
		while( jThis.width() > 133 && label.length > 10 )
		{
		    label = label.slice( 0, -4 ) + '...';
		    jThis.html( label );
		}
	});
}