<?php
	
// All this really does is given a year and month, return a JSON-encoded array
// containing the dates and the number of events for the respective date.
// 
// Example:
//
// Given year: '2016' and month: '02', and with 3 events on 2016-02-01, and 2 events on 2016-02-20,
// return ["2016-02-01" => 3, "2016-02-20" => 2].

$requested_year = isset($_GET["year"]) ? $_GET["year"] : null;
$requested_month = isset($_GET["month"]) ? $_GET["month"] : null;

if (!is_numeric($requested_year) || !is_numeric($requested_month)) {
	header("HTTP/1.1 400 Bad Request");
	die();
}

//Make sure there's enough padding so we access the correct key ('2' != '02')

$requested_month = str_pad($requested_month, 2, "0", STR_PAD_LEFT);

//Fake events:

$events = ["2016" => ["05" => ["16" => 2, "17" => 3, "18" => 4],
					  "06" => ["01" => 3, "02" => 4, "12" => 67]],
		   "2017" => ["02" => ["08" => 1]]];

//Check to see if any events exist for the given year and month

if (isset($events[$requested_year][$requested_month])) {
	
	$requested_events = $events[$requested_year][$requested_month];
	$response = [];
	
	//Generate a response of containing the date and number of events
	
	foreach ($requested_events as $current_day => $num_events) {
		
		//Date must be of the format yyyy-mm-dd
		$date_string = "$requested_year-$requested_month-$current_day";
		
		//Map the date to the number of events on that date
		$response[$date_string] = $num_events;
		
	}
	
	header("Content-Type: application/json");
	echo json_encode($response);
	
} else {
	header("HTTP/1.1 204 No Content");
}

?>