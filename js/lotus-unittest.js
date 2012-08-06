/************************************
* Lotus Charts UNIT TESTS JS v0.01  *
* August 01, 2012                   *
************************************/

/************************************
* Global Variables  	   	 	    *
************************************/

/************************************
* Basic Testing Functions  	  	    *
************************************/
// TODO: write documentation
function printTest(testName, expected, actual) {
    console.log("--------------------------------------------------------");
    console.log("Testing: " + testName);
    console.log("--------------------------------------------------------");
    console.log("Expected: " + expected);
    console.log("Actual  : " + actual);
    if (doTest(expected, actual)) {
        console.log("test passed\n");
        return 1;
    }
    else {
        console.log(">>>> test failed <<<<\n");
        return 0;
    }
}

function printGroupResults(testName, resultsArray) {
    console.log("========================================================");
    console.log(testName + ": complete.");
    console.log(resultsArray[0] + " passed out of " + resultsArray[1] + " tests.");
    console.log("========================================================\n\n");
}

// TODO: need to refactor to better test for arrays and objects
function doTest(expected, actual) {
    return expected === actual;
}

function sumArray(the_array) {
    var total = 0;
    for (x in the_array) { total += x; }
    return total;
}

function sumResult(resultsArray, test) {
    resultsArray[0] += test;
    resultsArray[1] += 1;
}

// Basic test group function body:

/*
function run_() {
    var testGroupName = "";
    var resultsArray = [0, 0];

    // tests
    sumResult(resultsArray, test_());

    printGroupResults(testGroupName, resultsArray);
}
*/

// Basic test function body:
/*
function test_() {
    var testName = "";
    var expected;
    var actual;

    // you should assign expected and actual values here

    return printTest(testName, expected, actual);
}
*/

/************************************
* Test Charts General               *
************************************/
function run_getNearestValueTests() {
    var testGroupName = "Get Nearest Value Tests";
    var resultsArray = [0, 0];

    sumResult(resultsArray, test_getNearestValue1());
    sumResult(resultsArray, test_getNearestValue2());
    sumResult(resultsArray, test_getNearestValue3());

    printGroupResults(testGroupName, resultsArray);
}

function test_getNearestValue1() {
    var testName = "getNearestValue() - Basic rounding down";
    var expected;
    var actual;

    var maxPixel = 300;
    var maxChartValue = 300;
    var pixel = 247;
    var increment = 5;
    
    expected = 245;
    actual = getNearestValue(maxPixel, maxChartValue, pixel, increment);
    return printTest(testName, expected, actual);
}

function test_getNearestValue2() {
    var testName = "getNearestValue() - Basic no rounding needed";
    var expected;
    var actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 300;
    var pixel = 247;
    var increment = 1;
    
    expected = 247;
    actual = getNearestValue(maxPixel, maxChartValue, pixel, increment);

    return printTest(testName, expected, actual);
}

function test_getNearestValue3() {
    var testName = "getNearestValue() - Basic rounding needed";
    var expected;
    var actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 300;
    var pixel = 247;
    var increment = 5;
    
    expected = 245;
    actual = getNearestValue(maxPixel, maxChartValue, pixel, increment);

    return printTest(testName, expected, actual);
}


function run_getNearestPixel() {
    var testGroupName = "Get Nearest Pixel Tests";
    var resultsArray = [0, 0];

    sumResult(resultsArray, test_getNearestPixel1());
    sumResult(resultsArray, test_getNearestPixel2());
    sumResult(resultsArray, test_getNearestPixel3());

    printGroupResults(testGroupName, resultsArray);
}

function test_getNearestPixel1() {
    var testName = "getNearestPixel() - Basic no rounding needed, one to one scale";
    var expected;
    var actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 300;
    var chartValue = 247;
    
    expected = 247;
    actual = getNearestPixel(maxPixel, maxChartValue, chartValue);

    return printTest(testName, expected, actual);
}

function test_getNearestPixel2() {
    var testName = "getNearestPixel() - Basic no rounding needed, double scale";
    var expected;
    var actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 600;
    var chartValue = 300;
    
    expected = 150;
    actual = getNearestPixel(maxPixel, maxChartValue, chartValue);

    return printTest(testName, expected, actual);
}

function test_getNearestPixel3() {
    var testName = "getNearestPixel() - Basic rounding needed";
    var expected;
    var actual;

    // you should assign expected and actual values here
    var maxPixel = 300;
    var maxChartValue = 1000;
    var chartValue = 334;
    
    expected = 100;
    actual = getNearestPixel(maxPixel, maxChartValue, chartValue);

    return printTest(testName, expected, actual);
}


function run_getChartScaleMax() {
    var testGroupName = "Get Chart Scale Max Tests";
    var resultsArray = [0, 0];
    
    var idString = "#purdy-fake-chart";
    var fakeChart = "<div id='purdy-fake-chart' rel='600'></div>";

    // tests
    sumResult(resultsArray, test_getChartScaleMax1(fakeChart, idString));
    sumResult(resultsArray, test_getChartScaleMax2(fakeChart, idString));
    sumResult(resultsArray, test_getChartScaleMax3(fakeChart, idString));

    printGroupResults(testGroupName, resultsArray);
}
*/

// Basic test function body:
function test_getChartScaleMax1(fakeChartString, idString) {
    // create fake chart div
    $(body).append(fakeChartString);
    
    var testName = "getNearestChartScaleMax() - valid value exists";
    var expected = 600;
    var actual = getChartScaleMax($(idString));

    // destroy fake chart div
    $(idString).remove();

    return printTest(testName, expected, actual);
}

function test_getChartScaleMax2(fakeChartString, idString) {
    // create fake chart div
    $(body).append(fakeChartString);
    $(idString).removeAttr("rel");
    // copy over temp_DEFAULT_MAX_SCALE
    var temp_DEFAULT_MAX_SCALE = DEFAULT_MAX_SCALE;
    DEFAULT_MAX_SCALE = 300;

    var testName = "getNearestChartScaleMax() - no rel value exists";
    var expected = 300;
    var actual = getChartScaleMax($(idString));

    // restore DEFAULT_MAX_SCALE
    DEFAULT_MAX_SCALE = temp_DEFAULT_MAX_SCALE;

    // destroy fake chart div
    $(idString).remove();

    return printTest(testName, expected, actual);
}

function test_getChartScaleMax3(fakeChartString, idString) {
    // create fake chart div
    $(body).append(fakeChartString);
    $(idString).attr("rel", "foo");
    // copy over temp_DEFAULT_MAX_SCALE
    var temp_DEFAULT_MAX_SCALE = DEFAULT_MAX_SCALE;
    DEFAULT_MAX_SCALE = 300;

    var testName = "getNearestChartScaleMax() - no rel value is not a number";
    var expected = 300;
    var actual = getChartScaleMax($(idString));

    // restore DEFAULT_MAX_SCALE
    DEFAULT_MAX_SCALE = temp_DEFAULT_MAX_SCALE;

    // destroy fake chart div
    $(idString).remove();

    return printTest(testName, expected, actual);
}

/************************************
* Main                              *
************************************/
// Main function calls
$(document).ready(function() {
    if (TESTING) {
        startTests();
    }
});

function startTests() {
    var totalTests = 0;
    var totalPassed = 0;
    
    run_getNearestValueTests();
    run_getNearestPixel();
    run_getChartScaleMax();
}
