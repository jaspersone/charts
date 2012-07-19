/************************************
* Lotus Charts Functions JS v0.01   *
* July 10, 2012                     *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/
var TESTING = true;
var IS_TOUCH_DEVICE = isTouchDevice();
/************************************
* Screen Information  	   	 	    *
************************************/
// params: none
// return: true if the device has a pixel density greater than or equal to 2, false otherwise
function isRetinaScreen() {
	return window.devicePixelRatio >= 2;
}

//	params: none
//	return: array of integer screen dimensions given as [width, height]
function getScreenDimensions() {
	var dimensions = [$('body').width(), $('body').height()];
	return dimensions;
}

/************************************
* Cookies                           *
************************************/

/*
Notes:
In order for this cookie library to work properly, all cookies
on the site should be set using the setCookie function. This
insures that proper formatting of cookies is set in the document.
If other cookies are being set (or created) without the use of
setCookie, it is possible that they may not appear in the results
from getCookie (because of how a cookies key and value are stored).
*/

// params: name = cookie key, value = cookie value, days = amount of days cookie should last 
// return: none
// behavior: given the name, value, and days, a cookie is set with the expiration of the current
//			 time plus the amount of days passed in as a param.
function setCookie(name, value, days) {
    var expires = '';
    if (days) {
        var expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + expirationDate.toGMTString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

// params: name = cookie key
// return: the value of the cookie if it exists, null otherwise
function getCookie(name) {
    var key = name + '=';
    var cookieDict = document.cookie.split(';');
    for (var i = 0; i < cookieDict.length; i++) { 
        var current = cookieDict[i];
        while (current.charAt(0)==' ') { // TODO: refactor this loop, replace with regex
            current = current.substring(1,current.length);
        }
        if (current.indexOf(key) == 0) {
            return current.substring(key.length, current.length);
        }
    }
    return null; // return null if current key is not found
}

// params: name = cookie key
// return: none
// behavior: deletes cookie with key == name by setting its expiration as yesterday
function delCookie(name) {
    setCookie(name, '', -1);
}

/************************************
* Charts General                    *
************************************/
// params: none
// return: true if device is a touch device, false otherwise
// behavior: when called, determines if click events are detected
function isTouchDevice() {
    return !!('ontouchstart' in window);
}

function makeClickableiOS() {
    $(".lotus-charts .pull-tab").click(function() {
        return false;
    });
}

/************************************
* Vertical Bar Charts               *
************************************/
// params: none
// return: none
// behavior: kick off all vertical bar charts functions needed to activate this portion of charts
function verticalBarCharts() {
    if (TESTING) console.log("Vertical Bar Charts Starting");

    // get maximum bar height
    MAX_BAR_HEIGHT = 300;
    detectTabEditing(MAX_BAR_HEIGHT);
}

function detectTabEditing(MAX_BAR_HEIGHT) {
    var $current_pull_tab = $(".lotus-charts.vertical-bar-chart .pull-tab");
    var $active_pull_tab = null;
    var isEditable = false;
    var isTouchDevice = false;

    // Don't fire mouse events if we're dealing with a touch device    
    if (true /*!IS_TOUCH_DEVICE*/) {
        // this section determines when editing should begin
        $current_pull_tab.mousedown(function() {
            isEditable = true;
            if (TESTING) { console.log("Tab touched"); }
            var $currentBar = $(this).parent();
            changeBarValue($currentBar);
        });
        
        // detects when editing should stop
        $(document).mouseup(function() {
            if (isEditable) {
                console.log("Tab released");
                isEditable = false;
            }
        });
    } else {
        // add touch related event listeners here
    }
}

function changeBarValue($bar) {
    if (TESTING) { console.log($bar); }
}
/************************************
* Main                              *
************************************/

// Main function calls
$(document).ready(function() {

	// get screen information
    var is_retina = isRetinaScreen();
    var screen_dimensions = getScreenDimensions(); // array [width, height]
	
	if (TESTING) {
		console.log("Initial Screen Dimensions are: " + screen_dimensions);
	}
	
	// keep screen_dimensions up to date
	window.onresize = function() {
		screen_dimensions = getScreenDimensions();
		if (TESTING)
			console.log("New screen dimensions are: " + screen_dimensions);
	}
	
	// check for internet explorer
    if ($.browser.msie) {
		alert("Hello IE, we meet again.")
	}

    // make areas clickable in iOS
    if (IS_TOUCH_DEVICE) {
        if (TESTING) { console.log("This is a touch device"); }
        makeClickableiOS();
    }
 
    // start up vertical bar charts
    verticalBarCharts();
});
