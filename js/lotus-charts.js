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
var DEFAULT_CHART_SEGMENT_WIDTH = 40;

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
function startHorizontalBarCharts() {
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

// params: jQuery bar object
// return: none
// behavior: grabs the bar's current value then assigns that as
//           the chart's max value as well as attached a class
//           max to the $bar (for easy finding later)
function assignMax($bar) {
    var currValue = parseInt(($bar).attr("rel"));
    // update highest value
    verticalBarMaxValue = currValue;
    // assign this bar class max
    ($bar).removeClass("max").addClass("max");
}

// params: $listToClear - a jQuery object of the list of bars to clear
// return: none
// behavior: O(n) running time, loops through and removes class "max"
//           from each element in the $listToClear
function clearAllMax($listToClear) {
    ($listToClear).each(function(i) {
        $(this).removeClass("max");
    });
}

// params: none
// return: none
// behavior: kick off all vertical bar charts functions needed to activate this portion of charts
function startVerticalBarCharts() {
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
            var $bubble = $(this);
            $input.val(currency + $(this).closest(".bar").attr("rel"));
            $bubble.addClass("open");
        }
    });

    // closing a bubble label without saving
    $(".bubble-label").find(".button-cancel").click(function(e) {
        var $bubble = $(this).closest(".bubble-label");
        $bubble.fadeOut(100);
        window.setTimeout(function() {
            $bubble.removeClass("open").fadeIn(100);
        }, 100);
        e.stopPropagation();
    });

    // closing a bubble label with saving
    $(".bubble-label").find(".button-set").click(function(e) {
        var $bubble = $(this).closest(".bubble-label");
        setBubbleLabel($bubble);
        e.stopPropagation();
    });

    // setup listening for enter button
    $(".edit-bubble input").keyup(function(e) {
        var $bubble = $(this).closest(".bubble-label");
        if (e.keyCode == 13) {
           setBubbleLabel($bubble);
        }
    });
}

function setBubbleLabel($bubble) {
        var $bar    = $bubble.closest(".bar");
        var $chart  = $bar.closest(".vertical-bar-chart");
        var value = parseInt($bubble.children(".edit-bubble").children("input").val().replace(/[^0-9\.]+/g, ''));
        // TODO: send value to db
        
        // update bubble label
        updateBubbleLabelFromValue($bubble, value);

        // update bar value
        setBarValue($bar, value);
        if (value > verticalBarScaleMax) {
            $bar.removeClass("edited-bar").addClass("edited-bar");
            findAndAssignMax(($chart).find(".bar"));
            rescaleChart($chart);
        } else {
            findAndAssignMax(($chart).find(".bar"));
            doRescale($chart);
        }

        $bubble.fadeOut(100);
        window.setTimeout(function() {
            $bubble.removeClass("open").fadeIn(100);
        }, 100);
}

function updateBubbleLabelFromValue($bubble, value) {
    if (value) {
        var normalizedValue = normalizeValue(value);
        $bubble.children(".number").html(normalizedValue[0]);
        $bubble.children(".metric").html(normalizedValue[1]);
        return true;
    } else {
        return false;
    }
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
* Line Charts                       *
************************************/
var lineChart_blue  = "#6dafe1";
var lineChart_green = "#5bbc19";
var lineChart_circleRadius = "6";
var lineChart_strokeWidth = "2";

// params: id       - the dom object id name
//         start    - the start date, formatted as a date string (YYYY/MM/DD)
//         end      - the end date, formatted as a date string(YYYY/MM/DD)
//         height   - the height (in px) of the container for the Line Chart
//         segWidth - the distance (in px) between data points on the graph
//         linesIn  - an array of Line objects that represent the data of this chart
// return: creates a new instance of a line chart
function LineChart(id, start, end, height, segWidth, linesIn, parentNode) {
    this.id = id;
    this.parentNode = parentNode ? parentNode : null;
    // Adding start and end dates, format to type date
    if (!(start instanceof Date)) {
        try {
            this.startDate = new Date(Date.parse(start, "yyyy/MM/dd"));
        } catch (e) {
            console.log("********************************************************");
            console.log("There has been an error while trying to parse start date");
            console.log(e);
            console.log("********************************************************");
        }
    } else {
        this.startDate  = start;
    }
    
    if (!(end instanceof Date)) {
        try {
            this.endDate = new Date(Date.parse(end, "yyyy/MM/dd"));
        } catch (e) {
            console.log("********************************************************");
            console.log("There has been an error while trying to parse end date");
            console.log(e);
            console.log("********************************************************");
        }
    } else {
        this.endDate    = end;
    }

    this.pixelHeight    = height ? height : MAX_BAR_HEIGHT;
    this.segmentPixelWidth = segWidth ? segWidth : DEFAULT_CHART_SEGMENT_WIDTH;
    this.minValue;
    this.maxValue;

    this.lines          = new Array();

    if (linesIn instanceof Array) {
        for (n in linesIn) {
            this.addLine(linesIn[n]);
        }
    } else if (linesIn instanceof Line) {
        this.addLine(linesIn);
    } else {
        if (typeof(linesIn) != "undefined") {
            console.log("LineChart Constructor Error: lines passed is not of type array or Line");
            console.log("Type found: " + typeof(linesIn));
        }
    }

    // if you add a lines, set their parent to this chart
    for (n in this.lines) {
        this.lines[n].parentChart = this;
    }
}

LineChart.prototype.addLine = function(line) {
    if (line instanceof Line) {
        line.parentChart = this;
        
        // change line data from string to array of values
        var temp = line.data.split(new RegExp("\\s+"));
        var data = [];
        var curr;
        for (i in temp) {
            curr = $.trim(temp[i]); 
            if (curr != "") {
                data.push(curr);
            }
        }
        line.data = data; 
        
        // add the line
        this.lines.push(line);

        // need to check min and max at this point
        var minMax = getMinMaxFromLine(line);
        
        if (minMax.length > 0) {
            this.minValue = this.minValue ? Math.min(this.minValue, minMax[0]) : minMax[0];
            this.maxValue = this.maxValue ? Math.max(this.maxValue, minMax[1]) : minMax[1];
        }
    } else {
        console.log("Error while trying to add line, passed line not found to be instance of Line")
        console.log("Line pass is of type: " + typeof(line));
    }
}

function getMinMaxFromLine(line) {
    var result = [];
    if (line.data.length > 0) {
        var localMin;
        var localMax;
        var index = 0;
        // check to see if there is an offset value for first of array
        if (line.data[index][0] == "(") {
            if (line.data.length > 1) {
                index++;
            }
        }
        // set initial min/max value to the first element's value
        localMin = parseInt(line.data[index]);
        localMax = parseInt(line.data[index]);
        // find local min and max
        for (index; index < line.data.length; index++) {
           localMin = Math.min(localMin, line.data[index]);
           localMax = Math.max(localMax, line.data[index]);
        }
        result.push(localMin);
        result.push(localMax);
    }
    return result;
}

// params: target - the DOM object to append the chart to
// return: none
LineChart.prototype.appendChartTo = function(target) {
    $target = $(target)
    if (TESTING) {
        console.log("<<<< In Append Chart >>>>");
        console.log("LineChart:     " + this.id);
        console.log("Start Date:    " + this.startDate);
        console.log("End Date:      " + this.endDate);
        console.log("Pixel Height:  " + this.pixelHeight);
        console.log("Segment Width: " + this.segmentPixelWidth);
        console.log("Chart Max Val: " + this.maxValue);
        console.log("Chart Min Val: " + this.minValue);
        console.log("Lines:         " + this.lines);
    }
    // build basic chart components
    var basicSVGSettings    = 'xmlns="http://www.w3.org/2000/svg" version="1.1"';
    var chartWidth          = 'width="100%"'; // TODO: make this dynamic based on seg width
    var chartHeight         = 'height="' + this.pixelHeight + '"';

    // build opening/closing svg strings
    var openSVGTag =  '<svg ' +
                       getIdString(this.id) + ' ' + 
                       basicSVGSettings + ' ' +
                       chartWidth + ' ' +
                       chartHeight + '>\n';
    var closeSVGTag = '</svg>\n';

    // build chart body
    var chartBody = [];
    for (i = 0; i < this.lines.length; i++) {
        var lineString = this.lines[i].getLineString();
        if (TESTING) {
            console.log("Trying to add line: " + lineString);
            console.log("Data:               " + this.lines[i].data);
        }
        chartBody.push(lineString);
    }
    if (TESTING) console.log("<<<< After lines loop >>>>");
    chartBody = chartBody.join('\n') + '\n';
    // build chart string
    var chartString = openSVGTag + chartBody + closeSVGTag;
    $target.append(chartString);
}

// params: parent - a LineChart object that owns this line
//         idName - the unique ID of this line (used for reference
//         className - a class name to assign to this line for styling
//         data - a string representation of the data points for this line
function Line(parentChart, idName, className, data, radius) {
    this.parentChart= parentChart ? parentChart : null;
    this.idName     = idName      ? idName      : null;
    this.className  = className   ? className   : null;
    this.data       = data        ? data        : null;
    this.circleRadius = radius    ? radius      : lineChart_circleRadius; 
}

Line.prototype.getLineString = function() {
    var myId    = getIdString(this.idName);
    var myClass = getClassString(this.className);
    var rawPoints = formatLineData(this.parentChart, this.data);
    if (TESTING) {
        console.log("<<<< GETTING RAW POINTS >>>>");
        console.log("passing data:");
        console.log(this.data);
        console.log("raw points:");
        console.log(rawPoints);
    }
    var points  = 'points="' + rawPoints.join(' ') + '"';
    var lineString = ['<polyline ' + myId + myClass + points + ' />']
    
    var circle;
    var coords;
    if (TESTING) {
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        console.log("rawPoints:         " + rawPoints);
        console.log("rawPoints length:  " + rawPoints.length);
        console.log("typeof(rawPoints): " + typeof(rawPoints));
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    }

    // TODO: FIX THIS IMMEDIATELY!!!
    //       causing infinite loop WTF!!!
    for (var i = 0; i < rawPoints.length; i++) {
        coords = rawPoints[i].split(",");
        lineString.push('<circle ' + myClass + 'cx="' + $.trim(coords[0]) + '" ' + 'cy="' + $.trim(coords[1]) + '" ' + 'r="' + this.circleRadius + '" />');
    }
    
    return lineString.join("\n");
}

// TODO: write this
// params: chart - the parent chart that the line data belongs to
//         input - the string representation of the line data
// return: the calculated points, based upon the chart dimensions
function formatLineData(chart, data) {
    if (!(data instanceof Array)) {
        return null;
    }
    var chartMinValue = chart.minValue;
    var chartMaxValue = chart.maxValue;
    var chartHeight   = chart.pixelHeight;
    var segWidth      = chart.segmentPixelWidth;
    var points        = [];
    var offset        = 0;
    var value;
    var y; 
    for (i = 0; i < data.length; i++) {
        value = data[i];
        if (value[0] === "(" || value[0] === "[" || value[0] === "{") {
            // note subtract and extra 1 from the length to make up for
            // i offset by his additional piece of information
            offset = (value.substring(1, value.length - 1) - 1) * segWidth;
        } else {
            y = calculateYPixel(value, chartMinValue, chartMaxValue, chartHeight);
            points.push((segWidth * i + offset).toString() + "," + y.toString());
        }
    }
    if (TESTING) {
        console.log("chartMinValue: " + chartMinValue);
        console.log("chartMaxValue: " + chartMaxValue);
        console.log("ChartHeight:   " + chartHeight);
        console.log("segWidth:      " + segWidth);
        console.log("Points: " + points);
    }
    return points;
}

// params: parameter - the html tag parameter to get a string for
//         value     - the value to assign to the html parameter
// return: if value is not empty or null, will return the proper
//         html formatted string, else returns the empty string.
function getParameterString(parameter, value) {
    if (value != null && value != "") {
        return parameter + '="' + value + '"';
    }
    return "";
}

// params: id - a string id name
// return: a string that is formatted as an html id attribute
function getIdString(id) {
    if (id != null && id != "" && typeof(id) === "string") {
        return getParameterString("id", id) + " ";
    }
    return "";
}
// params: class - a string class name, or set of space seperated class names
// return: a string that is formatted as an html class attribute
function getClassString(className) {
    if (className != null && className != "" && typeof(className) === "string") {
        return getParameterString("class", className) + " ";
    }
    return "";
}

function getLineChartsFromID(parentNodeID) {
    return filterCollectionForAttr($('#' + parentNodeID).children('svg'), 'rel');
}

// params: none
// return: an array of LineCharts
function getLineCharts() {
    // get charts from all
    var charts = []
    $(".lotus-charts.line-chart").each(function() {
        var data = $(this).attr('rel');
        if (data) {
            if (TESTING) {
                console.log("getLineCharts() - Found a LineChart section with data");
                console.log("data: " + data);
            }
            var dict = parseData(data);
            
            if (dict) {
                // grab local copies of standard values from dict
                var id          = dict["ID"];
                var start       = dict["START"];
                var end         = dict["END"];
                var height      = dict["HEIGHT"];
                var segWidth    = dict["INCREMENT"];
                var radius      = dict["RADIUS"];
                // remove standard values from dict
                delete dict["ID"];       
                delete dict["START"];    
                delete dict["END"];      
                delete dict["WIDTH"];
                delete dict["HEIGHT"];
                delete dict["INCREMENT"];
                delete dict["RADIUS"];

                // get lines from remaining items in dict
                var linesIn = []
                var keys = Object.keys(dict);

                var idName;
                var className;
                var data;
                for (k in keys) {
                    idName = "line-" + k;
                    if (id) {
                        idName = id + "-" + idName;
                    }
                    className = keys[k];
                    data = dict[className];
                    linesIn.push(new Line(null, idName, className, data, radius)); 
                }

                var lc = new LineChart(id, start, end, height, segWidth, linesIn, $(this));
                charts.push(lc);
            } else {
                if (TESTING) {
                    console.log("Could not parse data");
                }
            }
        }
    });
    return charts;
}

// TODO: Write this
// params: data - a string which is formatted as follows:
//
//  [
//    {'ID'               :'line-graph-02'},
//    {'START'            :'1980/11/24'},
//    {'END'              :'2012/12/14'},
//    {'WIDTH'            :'100%'},
//    {'HEIGHT'           :'400'},
//    {'INCREMENT'        :'50'},
//    {'RADIUS'           :'6'},
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< everything below would be custom lines
//                                              with the keys being the line's class name
//    {'cost'             :'20 50'},
//    {'projected-cost'   :'(2) 50 30'},
//    {'revenue'          :'120 150'},
//    {'projected-revenue':'(2) 150 130'},
//  ]
//
// return: a dictionary with all elements to the left of the colon as keys
//         and their associated values to the right of the colon.
function parseData(data) {
    // create dictionary object to hold kv pairs
    var dict = {};
    var pair;
    var key;
    var value;

    if (!data) {
        return dict;
    }

    // get rid of white space
    var input = $.trim(data);
    // ensure data begins and ends with "[" and "]"
    if (input[0] != "[" && input[input.length - 1] != "]") {
        if (TESTING) {
            console.log("parseData() : input passed is not formatted properly");
            console.log("input:\n" + data);
        }
        return null;
    }
    // remove "[]" and external white space, then split on commas
    // note at this point, input is no longer a string, but an array of strings
    input = ($.trim(input.substring(1, input.length - 1))).split(","); 

    // clean up any newlines, extra spaces, and "{}"
    for (i in input) {
        // validate input
        input[i] = $.trim(input[i]);
        if (input[i].length > 0) {
            if (input[i][0] != "{" && input[i][input.length - 1] != "}") {
                if (TESTING) {
                    console.log("parseData() : input passed in not formatted properly");
                    console.log("              in set " + i + ". Expected to find '{}'");
                    console.log("input: " + input[i]);
                }
                return null;
            }

            // if input is ok, trim off the {}
            pair = input[i].substring(1, input[i].length - 1).split(":");
            // validate kv pair
            if (pair.length != 2) {
                if (TESTING) {
                    console.log("parseData() : input passed in not formatted properly");
                    console.log("              was expecting a key value pair separated by a ':'");
                    console.log("input: " + input[i]);
                }
                return null;
            }
            key   = stripQuoteMarks($.trim(pair[0]));
            value = stripQuoteMarks($.trim(pair[1]));
            // add sanitized kv pair into the dictionary
            if (TESTING) {
                if (dict[key]) {
                    console.log("Found a duplicate entry for: " + key);
                    console.log("Proceeding by overwritting previous entry.");
                }
            }
            dict[key] = value;
        }
    }

    return dict;
}

// params: input - a string that needs to be stripped of its outer most set of quotes
// return: a string stripped of all leading and trailing quotes and whitespace
function stripQuoteMarks(input) {
    input = $.trim(input);
    var openQuote = input[0];
    var closeQuote = input[input.length - 1];

    if (TESTING) {
        if (openQuote != closeQuote) {
            console.log("stripQuoteMarks() : mismatched quotes");
            console.log("open quote found  : " + openQuote);
            console.log("close quote found : " + closeQuote);
        }
    }
    var start = openQuote === "'" || openQuote === '"' ? 1 : 0;
    var end   = closeQuote === "'" || closeQuote === '"' ? input.length - 1 : input.length;
    return input.substring(start, end);
}


function filterCollectionForAttr(collection, attrName) {
    var ret = []
    $(collection).each(function() {
        if ($(this).attr(attrName) != undefined) {
            ret.push(this);
        }
    });
    return ret;
}

function startLineCharts() {
    if (TESTING) { console.log("<<<< Line Charts Starting >>>>"); }
    var lineCharts = getLineCharts();
    
    for (i in lineCharts) {
        lineCharts[i].appendChartTo(lineCharts[i].parentNode);    
    }
    //$lineCharts = getLineChartsFromID('line-chart-set-01');
    //console.log($lineCharts);
}

// params: value - the value of the datapoint which will coordinate with the y value on the chart
//         chartMinValue - the minimum value of the current chart
//         chartMaxValue - the maximum value of the current chart
//         chartHeight - the height of the chart in pixels
// return: an integer representing the proper y offset from the top of the chart (for SVG)
function calculateYPixel(value, chartMinValue, chartMaxValue, chartHeight) {
    var yPosition = 0;
    // entire range of the chart
    var totalRange = chartMaxValue - chartMinValue;
    // position of the value relative to the bottom of the chart
    var normalizedPosition = value - chartMinValue;
    yPosition = chartHeight - getNearestPixel(chartHeight, totalRange, normalizedPosition);
    if (TESTING && totalRange < 0) {
        alert("Whoa, the chartMaxValue appears to be less than the chartMinValue in calculateYPixel!"); 
    }
    if (TESTING) {
        console.log("<<<< IN CALCULATE Y PIXEL >>>>");
        console.log("Input value:        " + value);
        console.log("chartMinValue:      " + chartMinValue);
        console.log("chartMaxValue:      " + chartMaxValue);
        console.log("chartHeight:        " + chartHeight);
        console.log("totalRange:         " + totalRange);
        console.log("normalizedPosition: " + normalizedPosition);
        console.log("Calculated Value:   " + yPosition);
    }
    return yPosition;
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

    if (TESTING) {
        console.log("Initial Screen Dimensions are: " + screen_dimensions);
    }
	
	// keep screen_dimensions up to date
	window.onresize = function() {
        debounce(function() {
            screen_dimensions = getScreenDimensions();
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
    startHorizontalBarCharts();
 
    // start up vertical bar charts
    startVerticalBarCharts();

    // start up line charts
    startLineCharts();
});
