// set up database
var db = openDatabase("Test", "1.0", "Test", 65535);

db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS concerns "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "concernName VARCHAR(100) NOT NULL, "
		+ "date DATETIME NOT NULL, " 
		// + "raisedBy VARCHAR(100) NOT NULL, "
		+ "pendingFor VARCHAR(100) NOT NULL, "
		+ "urgency VARCHAR(100) NOT NULL, "
		+ "notes TEXT NOT NULL, "
		+ "concernOrder INTEGER)"
	// var sql = "DROP TABLE concerns";
	transaction.executeSql(
		sql, 
		undefined, 
		function () {
		}, 
		function (transaction, err) {
			console.error(err);
		}
	);
});

db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS doctors "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," 
		+ "doctorName VARCHAR(100) NOT NULL, " 
		+ "specialty VARCHAR(100) NOT NULL)"
	// var sql = "DROP TABLE doctors";
	transaction.executeSql(
		sql,
		undefined,
		function () {},
		function (transaction, err) {
			console.error(err);
		}
	);
});

// TODO: what should the default sort be??
var DEFAULT_SORT = "date";
display_concerns(DEFAULT_SORT)

function load_landing_page() {

	$.mobile.changePage("#LandingPage");

	var $concern = $("#taskName");
	var $concernList = $("#concernList");

	// fill in information
	$("#info-name").val(localStorage.name);
	$("#info-age").val(localStorage.age);
	$("#info-update").val(localStorage.updated);

	display_concerns(DEFAULT_SORT);

}

// navigate to add concern page
$(document).on('tap', '#add-concern-button', function() {
	display_assigned_choices();
});

// add a doctor
$(document).on('tap', '#add-doctor-action', function () {
	console.log('derp');
	db.transaction(function(transaction) {
		var sql = 'INSERT INTO doctors (doctorName, specialty) VALUES (?, ?)';
		transaction.executeSql(
			sql,
			[$('#doctor-name').val(), $('#doctor-specialty').val()],
			function(transaction, result) {
				display_assigned_choices();
			},
			function(transaction, error) {
				console.error(error);
			}
		);
	})
});

function display_assigned_choices() {
	// console.log('displaying choices');
	db.transaction(function (transaction) {
		var sql = 'SELECT * FROM doctors';
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {
				if (result.rows.length) {
					$('#noDoctors').css('display', 'none');
					for (var i=0; i<result.rows.length; i++) {
						var row = result.rows.item(i);
						var doctorId = 'doctor-' + row.id;
						$('#assigned-choices-other').append(
							"<input type='checkbox' name='" + doctorId + "' id='" + doctorId + "' />"
							+ "<label for='" + doctorId + "'>" + row.doctorName + "</label>"
						).trigger('create');
					}
				}
			},
			function (transaction, err) {
				console.err(err);
			}
		);
	});
}

// Add concern
$(document).on("tap", "#addConcern", function() {
	var $concern = $("#taskName").val();
	var $i = 0;
	if ($concern != "") {
		var urgency = $('#urgency-choices input:checked').attr('id');
		var assigned_checked = $('#assigned-choices input:checked');
		var assigned_to = assigned_checked.attr('id'); // TODO: only does first right now
		db.transaction(function (transaction) {
			var sql = "INSERT INTO concerns (concernName, date, pendingFor, urgency, notes, concernOrder) VALUES (?, ?, ?, ?, ?, ?)";
			transaction.executeSql(
				sql, 
				[$concern, new Date(), assigned_to, urgency, $('#concern-notes').val(), 0], 
				function (transaction, result) {
					console.log([$concern, new Date(), assigned_to, urgency, 0]);
					$("#noErrors").css("display","none");
					$i = result.insertId;

					db.transaction(function (transaction) {
						var sql = "UPDATE concerns SET concernOrder=" + $("#concernList").children().size() + " WHERE id=" + $i;
						transaction.executeSql(
							sql, 
							undefined, 
							function () {}, 
							function (transaction, error) {
								console.error("error: " + error.message);
							}
						);
					});
					// TODO: clear all inputs

					for (var i=0; i < assigned_checked.length; i++) {
						assigned_checked[i].click();
					}
					$('#High').click();

					display_concerns(DEFAULT_SORT);
					$.mobile.changePage("#TaskView");		
					$("#taskName").val("");
					$('#concern-notes').val('');
				},
				function (transaction, error) {
					console.error(error);
				}
			);
		});
	} else {
		alert('Please enter a concern!');
	}
});


// Remove Task
$(document).on("tap", "#concernList.patient-view li a.close", function() {
	$i = $(this).parent().attr("id");
	db.transaction(function (transaction) {
		var sql = "UPDATE concerns SET concernOrder=-1 WHERE id=" + $i;
		transaction.executeSql(
			sql,
			undefined,
			function () {},
			function (transaction, error) {
				console.error(error);
			}
		);
	});
	$(this).parent().slideUp('normal', function(){
			$(this).remove();
		}
	);
	 	
	return false;
});

// Disable Task during visit
$(document).on("tap", "#concernList.doctor-view li a.close", function() {
	$(this).parent().addClass('ui-disabled');
	// TODO: change in database
	 	
	return false;
});

// sort order of tasks
$(document).bind('pageinit', function() {

    $( "#concernList" ).sortable();
    $( "#concernList" ).disableSelection();
    $( "#concernList" ).bind( "sortstop", function(event, ui) {
    	var $concernLi = $("#concernList li");
		db.transaction(function (transaction) {
			for (var i = 0; i < $concernLi.length; i++) {
				var elementId = $concernLi[i].id;
				var concernOrder = i + 1;
				var sql = "UPDATE concerns SET concernOrder=" + concernOrder + " WHERE id=" + elementId;
				transaction.executeSql(
					sql,
					undefined,
					function (transaction, result) {
						console.log(result);
					},
					function (transaction, error) {
						console.error(error);
					}
				);
			}
		});
		$('ul').listview('refresh');
    	$('#concernList').listview('refresh');
    });
});

// select order for display
$(function () {
	$('#sort-concerns').change(function() {

		var selected = $('#sort-concerns option:selected').val();
		display_concerns(selected);

		return false
	});
})

// set details for given task!
function set_details(id) {
	db.transaction(function (transaction) {
		var sql = "SELECT * FROM concerns WHERE id=" + id;
		transaction.executeSql(
			sql,
			undefined,
			function (transaction, result) {
				var item = result.rows.item(0);
				console.log(item.pendingFor, item.urgency)
				$("#detail-concern")[0].value = item.concernName;
				$('#detail-date')[0].value = item.date;
			    $('#detail-assigned')[0].value = item.pendingFor;
			    console.log($('#detail-urgency ' + '#' + item.urgency));
			    $('#detail-urgency ' + '#' + item.urgency).attr('checked', true);
			    $('#detail-notes')[0].value = item.notes;
			},
			function (transaction, error) {
				console.error(error);
			}
		);
	})
}

function display_concerns(sorted_by) {

	// fix the selector
	$("#sort-concerns").val(sorted_by).attr('selected', true).siblings('option').removeAttr('selected');
	$('#doctor-select').selectmenu('refresh', true);

	console.log('displaying concerns sorted by ' + sorted_by);
	$("#concernList").empty();
	db.transaction( function(transaction) {
		if (sorted_by == 'date') {
			var sql = "SELECT * FROM concerns ORDER BY " + sorted_by + ' DESC';
		} else {
			var sql = "SELECT * FROM concerns ORDER BY " + sorted_by;
		}
		transaction.executeSql(
			sql, 
			undefined, 
			function (transaction, result) {
				console.log(result.rows);
				if (result.rows.length) {
					$("#noErrors").css("display","none");
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						if (row.concernOrder != -1) {
							var color = "99ff99";
							if (row.urgency == "Medium")
								color = "ffff99";
							else if (row.urgency == "High")
								color = "ff9999";
							$("#concernList").append(
								"<li id='" + row.id + "' class='ui-li-has-alt'>"
								+ "<a style='background-color: #" + color + ";' href='#TaskDetails' onclick='set_details("+row.id+")' class='ui-btn'>" + row.concernName + "</a>" 
								+ "<a href='#' data-icon='delete' class='close ui-btn ui-btn-icon-notext ui-icon-delete'>Delete</a>"
								+ "</li>"
							);
						}
					}
				}
			}, 
			function (transaction, err) {
				console.error(err);
			}
		);
	});
}