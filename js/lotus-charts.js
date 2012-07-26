/************************************
* Lotus Charts Functions JS v0.01   *
* July 20, 2012                     *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/
var TESTING = true;
var MAX_BAR_HEIGHT = 300;
var vertical_bar_scale_max = 500; // vertical bar default Y access value (before resize)
var IS_TOUCH_DEVICE = false;
var MOUSE_COORDS = [0,0]; // tracks user's mouse coordinates [x,y]
var barIsEditable = false;
var coordsOnMouseDown = [0,0];

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

// params: none
// return: true if a touch device is detected, false otherwise
function isTouchDevice() {
    return 'ontouchend' in document;
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
function makeClickableiOS() {
    $(".lotus-charts .pull-tab").click(function() {
        return false;
    });
}

// params: none
// return: none
// behavior: when called, starts updating global array MOUSE_COORDS with current mouse's X and Y
//           position on the screen
function trackCoordinates() {
    $(document).mousemove(function(e) {
        MOUSE_COORDS[1] = e.pageY;
        MOUSE_COORDS[0] = e.pageX;
    });
}

// params: none
// return: array of mouse's X and Y coordinates at the time of the function call
// behavior: instead of returning the global array MOUSE_COORDS, creates a new array of the values
//           from MOUSE_COORDS
function getCurrentCoords() {
    return [MOUSE_COORDS[0], MOUSE_COORDS[1]];
}

// params:  barLength - the physical max length of the bar chart in pixels
//          maxChartValue - the maximum current value allowed in the chart
//          increment - the increment set by the user, default set is 1
// returns: function, that when called, will return
function mapChartValues(barLength, maxChartValue, increment = 1) {
}

/************************************
* Vertical Bar Charts               *
************************************/
// params: none
// return: none
// behavior: kick off all vertical bar charts functions needed to activate this portion of charts
function verticalBarCharts() {
    if (TESTING) console.log("Vertical Bar Charts Starting");
    var $pullTabs = $(".lotus-charts.vertical-bar-chart .pull-tab");
    var $currentBar = null;
    var $active_pull_tab = null;

    // set up initial Y access scale


    // don't scroll page when tabs are touched
    $pullTabs.on("touchmove", false);

    // Don't fire mouse events if we're dealing with a touch device    
    if (!IS_TOUCH_DEVICE) {
        // this section determines when editing should begin
        $pullTabs.mousedown(function(e) {
            barIsEditable = true;
            $currentBar = $(this).parent();
            coordsOnMouseDown = getCurrentCoords();
            if (TESTING) {
                console.log("Tab touched");
                console.log("Coords on mouse down: " + coordsOnMouseDown);
            }
        });
        
        // detects when editing should stop
        $(document).mouseup(function() {
            if (barIsEditable) {
                if (TESTING) {
                    console.log("Tab released");
                }
                barIsEditable = false;
            }
        });

        $(document).mousemove(function(e) {
            if (barIsEditable) {
                if (TESTING) {
                    console.log("<<<< mousedown && mousemove detected >>>>");
                }
                var currCoords = [e.pageX, e.pageY];
                changeBarValue($currentBar, coordsOnMouseDown, currCoords);
            }
        });
    } else { // beyond this for touch devices
        // add touch related event listeners here
        if (TESTING) {
            console.log("Touch device detected");
        }
        // this section determines when editing should begin
        $pullTabs.bind("touchstart", function(e) {
            barIsEditable = true;
            e.preventDefault();
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            coordsOnMouseDown[0] = touch.pageX;
            coordsOnMouseDown[1] = touch.pageY;
            if (TESTING) {
                console.log("Tab touched");
                console.log("Coords on touchstart: " + coordsOnMouseDown);
            }
        });
        
        // detects when editing should stop
        $pullTabs.bind("touchend", function() {
            if (barIsEditable) {
                if (TESTING) {
                    console.log("Tab released");
                }
                barIsEditable = false;
            }
        });

        $pullTabs.bind("touchmove", function(e) {
            if (barIsEditable) {
                e.preventDefault();
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                var currCoords = [touch.pageX, touch.pageY];
                $currentBar = $(this).parent();

                if (TESTING) {
                    console.log("<<<< touchmove detected >>>>");
                    console.log("     coordinate: " + currCoords);
                    console.log("     currentBar: " + $currentBar);
                    console.log("     coordsOnMouseDown: " + coordsOnMouseDown);
                    console.log("     about to send to changeBarValue");
                }
                changeBarValue($currentBar, coordsOnMouseDown, currCoords);
            }
        });
    }
}

function changeBarValue($bar, initialCoords, currCoords) {
    // lock bar editing until this is function completes
    var initialHeight = ($bar).height();
    var diffX = currCoords[0] - initialCoords[0];
    var diffY = currCoords[1] - initialCoords[1];
    var adjustedY = ($bar).height() - diffY; // subtract b/c bar Y pixels are measured from top to bottom

    if (TESTING) {
        console.log("<<<< In changeBarValue >>>>");
        console.log("     initialHeight : " + initialHeight);
        console.log("     adjustedY     : " + adjustedY);
        console.log($bar);
        console.log("     Initial mouse coordinates  : " + initialCoords);
        console.log("     Current mouse coordinates  : " + coordsOnMouseDown);
        console.log("     New adjusted height        : " + adjustedY);
    }

    if (diffY !=0 && adjustedY <= MAX_BAR_HEIGHT && adjustedY >= 0) { 
        if (TESTING) { console.log("Inside changing bar height"); }
        var newHeight = adjustedY + "px";
        ($bar).css("height", newHeight);
        if (!($bar).hasClass('saved')) { ($bar).addClass('saved'); }
        if (adjustedY <= 0) {
            ($bar).removeClass('zero'); // do not add duplicate class
            ($bar).addClass('zero');
        } else {
            ($bar).removeClass('zero');
        }
        // must reset coordsOnMouseDown (consider renaming so this makes more sense)
        coordsOnMouseDown[0] = initialCoords[0] + diffX;
        coordsOnMouseDown[1] = initialCoords[1] + diffY;
    } else {
        console.log("Hitting the limit!!!!");

        // add code for what to do, MAX_BAR_HEIGHT - 10% of height
        
        // add handling for below zero
    }
}
/************************************
* Main                              *
************************************/

// Main function calls
$(document).ready(function() {

	// get screen information
    var is_retina = isRetinaScreen();
    var screen_dimensions = getScreenDimensions(); // array [width, height]
    IS_TOUCH_DEVICE = isTouchDevice();

	if (TESTING) {
		console.log("Initial Screen Dimensions are: " + screen_dimensions);
	}
	
	// keep screen_dimensions up to date
	window.onresize = function() {
		screen_dimensions = getScreenDimensions();
		if (TESTING) {
			console.log("New screen dimensions are: " + screen_dimensions);
            console.log("IS_TOUCH_DEVICE:" + IS_TOUCH_DEVICE);
        }
	}
	
	// check for internet explorer
    if ($.browser.msie) {
		alert("Hello IE, we meet again.")
	}

    // start tracking mouse coordinates
    if (!IS_TOUCH_DEVICE) {
        trackCoordinates();
    } else {
        if (TESTING) { console.log("This is a touch device"); }
        makeClickableiOS();
    }
 
    // start up vertical bar charts
    verticalBarCharts();
});
