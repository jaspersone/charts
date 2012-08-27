/************************************
* Lotus Charts Functions JS v0.01   *
* July 28, 2012                     *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/
var TESTING = true;
var AJAX_ON = false;
var MAX_BAR_HEIGHT = 300; // in pixels
var DEFAULT_MAX_SCALE = 300; // vertical bar default Y access value (before resize)

var verticalBarScaleMax; // maximum size of the chart
var verticalBarIncrement; // the size of the chart increments
var verticalBarMaxValue; // the current maximum bar value within a chart (not the max size of the chart)

var screen_dimensions;
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
* Utility Functions                 *
************************************/
// params: callback - a function to call after the settimeout has been expired
//         ms - the amount of milliseconds to listen for another duplicate event before
//              firing the callback function
//         uniqueID - a string that should be unique and used a key to find the specific timeout for
//                    a set of duplicate events
// return: a function that takes the above parameters
// behavior: stops event related queues from building up by only allowing last function call to run 
var debounce = (function() {
    // create new dictionary of timers to be filled later
    var timers = {};
    return function(callback, ms, uniqueID) {
        // if no unique id is given, use default
        if (!uniqueID) {
            uniqueID = "Don't call this twice without a uniqueID, or funky stuff will happen";
        }
        // clear timer if another event with same unique id is found
        if (timers[uniqueID]) {
            clearTimeout(timers[uniqueID]);
        }
        // assign new timer to hit callback function after ms has expired
        timers[uniqueID] = setTimeout(callback, ms);
    };
})();

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
function getCurrentMouseCoords() {
    return [MOUSE_COORDS[0], MOUSE_COORDS[1]];
}

// TODO: write documentation
function getNearestPixel(maxPixels, maxChartValue, chartValue) {
    return Math.floor((chartValue / maxChartValue) * maxPixels);
}

// TODO: make sure that it doesn't return a value that has more than 1 decimal when converted
function getNearestValue(maxPixels, maxChartValue, pixel, increment) {
    var percentage = pixel / maxPixels;
    var nearestValueBase = Math.round(maxChartValue * percentage);
    return increment * Math.floor(nearestValueBase / increment); 
}

// params: $chart - a jquery object representing the chart
// return: the current maximum value of the chart
// behavior: the chart should have its max value embedded as the attribute "rel".
//           this function simply returns that value as an integer
function getChartScaleMax($chart) {
    var relValue = parseInt($chart.attr("rel"));
    if (isNaN(relValue)) {
        return DEFAULT_MAX_SCALE;
    } else {
        return relValue ? parseInt(relValue) : DEFAULT_MAX_SCALE;
    }
}

// params: $bar - a jquery object of the bar to find the value of
// return: either an integer value of the bar or false if the bar does not exist
// behavior: by calling method with a valid bar, the function attempts to return the rel value, which is
//           where the function expects the $bar to store its value
function getBarValue($bar) {
    return $bar ? parseInt(($bar).attr("rel")) : false;
}

// params: $bar - a jquery object that the user wants to set a value for
//         value - an integer value that will be assigned to the bar
// return: true if the value was assigned, false otherwise
// behavior: setBarValue expects value to be a number, if it is a number it will set the object $bar's rel value
//           equal that number and return true. otherwise it will return false.
// TODO: also update backends in the future
function setBarValue($bar, value) {
    if (isNaN(value)) return false;
    ($bar).attr("rel", value);
    return true;
}

// params: $chart - a jquery object representing the chart
//         newValue - the value to set the chart's new max height
// return: n/a
// behavior: the chart's rel value is changed to match the updated value as well as the
//           global variable verticalBarScaleMax
// TODO: also update the backends in the future
function setChartScaleMax($chart, newValue) {
    verticalBarScaleMax = parseInt(newValue);
    $chart.attr("rel", newValue);
}

// TODO: need to refactor for efficiency
function getBestIncrement(maxValue, pixels) {
    // get height of the container
    var power = Math.floor(Math.log(maxValue / pixels) / Math.log(10)); // TODO: figure out the math
    return power < 0 ? 1 : Math.pow(10, power);  
}

// TODO: refactor and document
function normalizeValue(value) {
    var normalizedValue;
    var metric;
    if (value > 999999999999) { // trillions
        metric = "T";
        normalizedValue = value / 1000000000;
    } else if (value > 999999999) { // billions
        metric = "G";
        normalizedValue = value / 1000000000;
    } else if (value > 999999) { // millions
        metric = "M";
        normalizedValue = value / 1000000;
    } else if (value > 999) { // thousands
        metric = "K";
        normalizedValue = value / 1000;
    } else {
        metric = ""; // remove
        normalizedValue = value;
    }
    return [normalizedValue, metric];
}

// TODO: finish function
// params: $chart - chart to rescale
// return: true if chart rescaled, false otherwise
// behavior: checks for elements inside chart with class edited-bar then checks their value to determine
//           if they need to be rescaled
function rescaleChart($chart) {
    // only get the bar that has been edited last
    var $editedBar = ($chart).find(".edited-bar");
    var value = getBarValue($editedBar);
    // after getting a handle on the edited bar remove class edited-bar
    ($editedBar).removeClass("edited-bar");

    if (TESTING) {
        console.log("In rescale chart");
    }
    
    // only resize chart if it is necessary
    if (isNaN(value)) {
        return false;
    }

    if (value >= verticalBarScaleMax || (value <= verticalBarMaxValue && verticalBarMaxValue < (.5 * verticalBarScaleMax)) ) {
        doRescale($chart);
        return true;
    }
    return false;
}

// params: $chart - a jQuery object representing the chart that needs to be rescaled
// return: none
// behavior: a helper function for resizeChart(), which makes function calls to
//           calculate charts new scale max, rescales the axis, then resizes the bars
function doRescale($chart) {
    // set new max value
    verticalBarScaleMax = calculateNewMaxChartValue(verticalBarMaxValue);
    // update scale html
    rescaleAxis($chart, verticalBarScaleMax); 
    // update all bars
    resizeBars($chart, verticalBarScaleMax);
}

// TODO: refactor
// params: currValue - an integer representing the largest value inside a chart of multiple bars
// return: an integer representing the closest integer multiple of 10 which bounds the currValue
//         passed to the function.
// behavior: the bounding number returned will only have 1 siginificant leading digit, and the rest
//           of the places will be zeros
function calculateNewMaxChartValue (currValue) {
    var valueString = currValue.toString(); 
    var count = valueString.length - 1;
    var first = parseInt(valueString[0]);
    // return new max value
    var result = (first + 1) * Math.pow(10, count);
    return result > DEFAULT_MAX_SCALE ? result : DEFAULT_MAX_SCALE; 
}

function calculateNewMaxChartValue_OLD (currValue) {
    var count = 0;
    var result;
    while (currValue >= 10) {
        currValue = currValue / 10;
        count++;
    }
    // return new max value
    result = (Math.floor(currValue) + 1) * Math.pow(10, count);
    return result > DEFAULT_MAX_SCALE ? result : DEFAULT_MAX_SCALE; 
}


// params: $chart - the jquery object that represents the chart's outer wrapper
//         chartMax - the adjusted max value of the chart
// return: none
// behavior: given the new chart
function rescaleAxis($chart, chartMax) {
    debounce(function() {
        var $chartScaleSegments = ($chart).find(".chart-scale").children();
        var numSegments = ($chartScaleSegments).length;
        var increment = Math.floor(chartMax / numSegments);
        
        ($chartScaleSegments).each(function(index) {
            var value = chartMax - (index * increment);
            // normalizedArray = [normalized value, units];
            var normalizedArray = normalizeValue(value);

            // set new values
            $(this).children(".number").html(normalizedArray[0]);
            $(this).children(".metric").html(normalizedArray[1]);

            if (TESTING) {
                console.log(index + ": " + $(this).html());
                console.log("new value: " + normalizedArray[0] + normalizedArray[1]);
            }
        }); 

        // reset vertical bar increment
        var chartHeight = $(".vertical-bar-chart .chart-slice-window").height()
        verticalBarIncrement = getBestIncrement(verticalBarScaleMax, chartHeight);
    }, 500, "rescale vertical bar access");
}

function resizeBars($chart, chartMax) {
    var animationTime = 1000;
    var $chartBars = ($chart).find(".bar");
    ($chartBars).each(function(index) {
        // find new pixel to go to
        var newHeight = getNearestPixel(MAX_BAR_HEIGHT, chartMax, parseInt($(this).attr("rel"))) + "px";
        if (TESTING) {
            console.log("<<<< BAR " + index + " >>>>");
            console.log("Old height: " + $(this).height());
            console.log("new height: " + newHeight);
        }
        // animate to new pixel
        $(this).animate({height: newHeight,}, animationTime, "swing").css("overflow", "visible");
    });

    if (TESTING) {
        console.log("In resizeBars()");
    }
}

/************************************
* Horizontal Bar Charts             *
************************************/
function horizontalBarCharts() {
    var animationTime = 1500;
    $(".lotus-charts.horizontal-bar-chart").each(function() {
        animateHorizontalBar($(this), animationTime);
    });
}

// TODO: resizing windows causes outside container to change, but does not change inside
//       bar size
function animateHorizontalBar($chart, animationTime) {
    var $marker = ($chart).find(".chart-marker");
    var $bar    = ($chart).find(".fill");
    var maxPixels =  $bar.parent().width() - 8;
    var maxChartValue = parseInt(($chart).attr("rel"));
    var chartValue = parseInt(($chart).children(".chart-marker-box").attr("rel"));

    var pixelWidth = getNearestPixel(maxPixels, maxChartValue, chartValue);

    var valueString = pixelWidth + "px";
    
    $marker.css("left", "0px");
    $bar.css("width", "0px");

    $marker.animate({left: valueString,}, animationTime, "swing");
    $bar.animate({width: valueString,}, animationTime, "swing");

    if (TESTING) {
        console.log("<<<< In Animate Horizontal Bar >>>>");
        console.log("maxPixels:     " + maxPixels);
        console.log("maxChartValue: " + maxChartValue);
        console.log("chartValue:    " + chartValue);
        console.log("pixelWdith:    " + pixelWidth);
        console.log("valueString:   " + valueString);
    }
}

/************************************
* Vertical Bar Charts               *
************************************/
//warning: this algorithm is potentially O(N^2) and will loop through entire list
//         try to call it sparingly
function findAndAssignMax($listToFindMaxFrom) {
    if (TESTING) {
        console.log("<<<< in findAndAssignMax() >>>>");
    }
    // reset highest value
    verticalBarMaxValue = -1;
 
    ($listToFindMaxFrom).each(function(index) {
        var currValue = getBarValue($(this));
        if (TESTING) {
            console.log(" current max value: " + verticalBarMaxValue);
            console.log(" this bar value:    " + currValue);
        }
        if (currValue > verticalBarMaxValue) {
            // clear all other maxes
            clearAllMax($listToFindMaxFrom);
            // assign this one class max
            assignMax($(this));
        }
    });
}

function assignMax($bar) {
    var currValue = parseInt(($bar).attr("rel"));
    // update highest value
    verticalBarMaxValue = currValue;
    // assign this bar class max
    ($bar).removeClass("max").addClass("max");
}

function clearAllMax($listToClear) {
    ($listToClear).each(function(i) {
        $(this).removeClass("max");
    });
}

// params: none
// return: none
// behavior: kick off all vertical bar charts functions needed to activate this portion of charts
function verticalBarCharts() {
    if (TESTING) console.log("Vertical Bar Charts Starting");
    var $chart = $(".lotus-charts.vertical-bar-chart"); 
    verticalBarScaleMax = getChartScaleMax($chart);
    var chartHeight = $(".vertical-bar-chart .chart-slice-window").height()
    verticalBarIncrement = getBestIncrement(verticalBarScaleMax, chartHeight);

    // set up initial Y access scale
    // don't scroll page when tabs are touched $pullTabs.on("touchmove", false);
    // Don't fire mouse events if we're dealing with a touch device    
    var $pullTabs = $(".lotus-charts.vertical-bar-chart .pull-tab");
    var $currentBar = null;
   
    // loop through and find highest value and assign it class max
    findAndAssignMax(($chart).find(".bar"));
       
    if (!IS_TOUCH_DEVICE) {
        // this section determines when editing should begin
        $pullTabs.mousedown(function(e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            barIsEditable = true;
            
            // mark as current edited bar
            $currentBar = $(this).parent();
            $currentBar.addClass("edited-bar");

            coordsOnMouseDown = getCurrentMouseCoords();
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

                findAndAssignMax(($chart).find(".bar"));
                // rescale chart
                rescaleChart($chart);
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

            // mark as current edited bar
            $currentBar = $(this).parent();
            $currentBar.addClass("edited-bar");

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
            debounce(function() {
                if (barIsEditable) {
                    if (TESTING) {
                        console.log("Tab released");
                    }

                    findAndAssignMax(($chart).find(".bar"));
                    // rescale chart
                    rescaleChart($chart);
                    barIsEditable = false;
                }
            }, 500, "vertical-bar-chart-pullTabs-touchend");
        });

        $pullTabs.bind("touchmove", function(e) {
            if (barIsEditable) {
                e.preventDefault();
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                var currCoords = [touch.pageX, touch.pageY];

                if (TESTING) {
                    console.log("<<<< touchmove detected >>>>");
                    console.log("     coordinate: " + currCoords);
                    console.log("     currentBar: " + $currentBar);
                    console.log("     coordsOnMouseDown: " + coordsOnMouseDown);
                    console.log("     about to send to changeBarValue");
                }
                changeBarValue($(this).parent(), coordsOnMouseDown, currCoords);
            }
        });
    }
    setupBubbleLabels();
}

function setupBubbleLabels() {
    // opening a bubble label
    $(".bubble-label").click(function() {
        if (!$(this).hasClass("open")) {
            // add value of the rel into input box
            var currency = $(this).find(".currency").html();
            var $input = $(this).find("input");
            $input.val(currency + $(this).closest(".bar").attr("rel"));
            $(this).addClass("open");
        }
    });

    // closing a bubble label without saving
    $(".bubble-label").find(".button-cancel").click(function(e) {
        $(this).closest(".bubble-label").removeClass("open");
        e.stopPropagation();
    });

    // closing a bubble label with saving
}

function changeBarValue($bar, initialCoords, currCoords) {
    // lock bar editing until this is function completes
    var initialHeight = ($bar).height();
    var diffX = currCoords[0] - initialCoords[0];
    var diffY = currCoords[1] - initialCoords[1];
    var adjustedY = ($bar).height() - diffY; // subtract b/c bar Y pixels are measured from top to bottom

    var maxChartValue = verticalBarScaleMax;
    var increment = verticalBarIncrement; // this value must be dynamically set later by user

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
        var newHeight;
        if (adjustedY <= 0) { // gone below 0
            ($bar).css("height", "0").removeClass('zero').addClass('zero');
        }
        if (adjustedY >= MAX_BAR_HEIGHT) { // gone above max height
            ($bar).css("height", MAX_BAR_HEIGHT + "px");
       }

        // add code for what to do, MAX_BAR_HEIGHT - 10% of height
        
        // add handling for below zero
    }
    if (diffY != 0) {
        // change the value of the label
        var updatedValue = changeLabelValue($bar, maxChartValue, adjustedY, increment);
        
        // change the value of the bar's rel
        ($bar).attr("rel", updatedValue);
        
        // if larger than max, assign it to be max
        if (updatedValue > verticalBarMaxValue) {
            findAndAssignMax($(".lotus-charts.vertical-bar-chart").find(".bar"));
        }

        if (TESTING) {
            console.log("Value to send to server: " + updatedValue);
        }
    }
}

function changeLabelValue($bar, maxChartValue, currPixel, increment) {
    var value = getNearestValue(MAX_BAR_HEIGHT, maxChartValue, currPixel, increment);
    // don't allow negative values
    value = (value < 0) ? 0 : value;
    
    var $label      = ($bar).children(".bubble-label");
    var $input      = ($label).children(".edit-bubble").children("input");
    var $number     = ($label).children('.number');
    var $metric     = ($label).children('.metric');
    
    var newValues   = normalizeValue(value);
    var normalizedValue = newValues[0];
    var units       = newValues[1];

    // update input value
    $input.val("$" + value);

    // update label value
    $metric.html(units);
    $number.html(normalizedValue);
    
    return value;
}

/************************************
* Main                              *
************************************/
// Main function calls
$(document).ready(function() {

	// get screen information
    screen_dimensions = getScreenDimensions(); // array [width, height]
    IS_TOUCH_DEVICE = isTouchDevice();

    if (isRetinaScreen()) {
        // load retina assets
    } else {
        // load regular assets
    }

    if (TESTING) { console.log("Initial Screen Dimensions are: " + screen_dimensions); }
	
	// keep screen_dimensions up to date
	window.onresize = function() {
        debounce(function() {
            screen_dimensions = getScreenDimensions();
            if (TESTING) { console.log("New screen dimensions are: " + screen_dimensions); }
        }, 500, "Screen dimensions");
	}
	
	// check for internet explorer
    if ($.browser.msie) {
		alert("Hello IE, we meet again.")
	}

    // start tracking mouse coordinates
    if (!IS_TOUCH_DEVICE) {
        trackCoordinates();
    } else {
        // no need to track coordinates on a touch device
        // as they are only updated on touchstart/touchend
        // or touchmove.
        makeClickableiOS();
    }

    // start up horizontal bar charts
    horizontalBarCharts();
 
    // start up vertical bar charts
    verticalBarCharts();
});
