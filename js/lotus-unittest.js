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
    console.log("--------------------------------------------------------");
    console.log("--------------------------------------------------------");
    console.log(testName + ": complete.");
    console.log(resultsArray[0] + " passed out of " + resultsArray[1] + " tests.");
    console.log("--------------------------------------------------------");
    console.log("--------------------------------------------------------");
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
    
    var nearestValueTests_results = run_getNearestValueTests();
}
