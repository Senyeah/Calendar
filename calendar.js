var currentDate = new Date();

var selectedDate = null;
var selectedCell = null;

//Because this isn't a thing they thought would ever be needed:

Date.prototype.monthNames = [
    "January", "February", "March",
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December"
];
	
Date.prototype.getMonthName = function() {
    return this.monthNames[this.getMonth()];
};
	
Date.prototype.getShortMonthName = function() {
    return this.getMonthName().substr(0, 3);
};

//Misc helpers:

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

//Returns the number of weeks in the given month

function weekCount(year, month) {
	var firstOfMonth = new Date(year, month, 1);
    var lastOfMonth = new Date(year, month + 1, 0);

    var used = firstOfMonth.getDay() + lastOfMonth.getDate();

    return Math.ceil(used / 7);
}


//Returns an array containing values from [low, high]

function range(low, high){
    var arr = [];
    var i = high - low + 1;
    
    while (i--) {
        arr[i] = high--;
    }
    
    return arr;
}


//Returns a rows by cols array initalised with defaultValue

function matrix(rows, cols, defaultValue) {
    var arr = [];

    for (var i = 0; i < rows; i++){
        arr.push([]);
        arr[i].push(new Array(cols));
        
        for (var j = 0; j < cols; j++){
            arr[i][j] = defaultValue;
        }
    }
    
    return arr;
}

//Date helpers

function dayAfter(date) {
	var copy = new Date(date.getTime());
	copy.setDate(date.getDate() + 1);
	
	return copy;
}

function dayBefore(date) {
	var copy = new Date(date.getTime());
	copy.setDate(date.getDate() - 1);
	
	return copy;
}

function monthAfter(date) {
	var copy = new Date(date.getTime());
	copy.setMonth(date.getMonth() + 1);
	
	return copy;
}

function monthBefore(date) {
	var copy = new Date(date.getTime());
	copy.setMonth(date.getMonth() - 1);
	
	return copy;
}

function parseDate(input) {
	var parts = input.split("-");
	return new Date(parts[0], parts[1] - 1, parts[2]); // Note: months are 0-based
}

function displayEvents(year, month, dateCellMap) {
	
	$.getJSON("events.php", {year: year, month: month}, function(eventInfo) {
		
		$.each(eventInfo, function(date, numberOfEvents) {
			
			var $eventCountIndicator = $("<div>");
			
			$eventCountIndicator.addClass("event-indicator");
			$eventCountIndicator.text(numberOfEvents);
			
			$(dateCellMap[parseDate(date)]).append($eventCountIndicator);
			
		});
		
	});
	
}

function dateForTableCell(row, column, displayedYear, displayedMonth) {
	
	var weeks = weekCount(displayedYear, displayedMonth);
	
	if (row + 1 > weeks) {
		return null;
	}
	
	//Create an array which can map (row, column) to a date
	
	var map = dateForTableCell.prototype.dateMap;
	
	if (map == null) {
	
		map = matrix(weeks, 7, null);
		
		//Find out what day of the week this month starts on,
		//which means that every column to the left of this is from the previous month
		
		var monthStartDay = new Date(displayedYear, displayedMonth, 1);
		var monthStartIndex = monthStartDay.getDay();
		
		map[0][monthStartIndex] = monthStartDay;
		
		//Set all of the previous days in the first week
		
		var currentIndex = monthStartIndex;
		
		while (--currentIndex >= 0) {
			var currentDay = map[0][currentIndex + 1];
			map[0][currentIndex] = dayBefore(currentDay);
		}
		
		//Set all the days in the first week after the first day of the month
		
		currentIndex = monthStartIndex;
		var currentDay = monthStartDay;
		
		while (++currentIndex < 7) {
			currentDay = dayAfter(currentDay);
			map[0][currentIndex] = currentDay;
		}
		
		//Continue on setting the rest of the weeks, going week by week
		
		$.each(range(2, weeks), function(row) {
			var week = row + 1;
	
			$.each(range(1, 7), function(day) {
				currentDay = dayAfter(currentDay);
				map[week][day] = currentDay;
			});
		});
	
	}
	
	return map[row][column];
	
}

function generateTable(year, month) {
	
	var numberOfRows = weekCount(year, month);
	var $table = $("<table>");
	
	//Invalidate the old map since it would contain a map for a different month
	
	dateForTableCell.dateMap = null;
	
	var dateCellMap = {};
	
	$.each(range(1, numberOfRows), function(row) {
		
		var $row = $("<tr>");
		
		$.each(range(1, 7), function(column) {
			
			var cellDate = dateForTableCell(row, column, year, month);
			var cellText = cellDate.getDate();
			
			//Append the month name if it's the first of the month
			
			if (cellDate.getDate() == 1) {
				cellText += " " + cellDate.getShortMonthName();
			}
			
			var $column = $("<td>");
			$column.append(cellText);
			
			//Grey it out if it isn't the current month
			
			if (cellDate.getMonth() != month) {
				$column.addClass("not-current-month");
			}
			
			//Highlight it if it's today
			
			var isToday = cellDate.toDateString() == new Date().toDateString();
			
			if (isToday) {
				$column.addClass("today");
			}
			
			//Select the cell if nothing else is selected or if it was previously selected
			
			if ((selectedCell == null && isToday) ||
				(selectedCell != null && cellDate.toDateString() == selectedDate.toDateString())) {
					
				$column.addClass("selected");
				
				selectedCell = $column;
				selectedDate = cellDate;
				
			}
			
			//Add the click handler for the cell
			
			$column.click(function() {
				
				$(selectedCell).removeClass("selected");
				$column.addClass("selected");
				
				selectedCell = $column;
				selectedDate = cellDate;
				
			});
			
			//Add the cell and its date to the date-cell map...
			
			dateCellMap[cellDate] = $column;
			
			//...then to the table row
			
			$row.append($column);			
			
		});
		
		$table.append($row);
		
	});
	
	displayEvents(year, month + 1, dateCellMap);
	
	return $table;
	
}

function updateCalendar() {
	
	//Set the month title
	
	$("#calendar-timeframe").text(currentDate.getMonthName() + " " + currentDate.getFullYear());

	//Add the calendar to its container

	var $newTable = generateTable(currentDate.getFullYear(), currentDate.getMonth());
	$("#calendar-container").html($newTable);

}

$(document).ready(function() {
	
	//Click handlers
	
	$("#calendar-previous-month").click(function() {
		currentDate = monthBefore(currentDate);
		updateCalendar();
	});
	
	$("#calendar-next-month").click(function() {
		currentDate = monthAfter(currentDate);
		updateCalendar();
	});
	
	$("#calendar-add-action").click(function() {
		var dateString = selectedDate.getFullYear() + "-" + padDigits(selectedDate.getMonth() + 1, 2) + "-" + padDigits(selectedDate.getDate(), 2);
		window.location = $("#calendar-add-action").data("onclick-url") + "?" + $.param({date: dateString});
	});
	
	//Set the calendar's height
	
	var calendarHeight = $("#calendar").height() - $("#calendar-header").outerHeight() - $("#calendar-days-of-week").outerHeight();
	$("#calendar-container").height(calendarHeight);
		
	//Render the thing
	
	updateCalendar();
	
});