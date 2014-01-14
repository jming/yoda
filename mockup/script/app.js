
/* DATABASE SET UP FUNCTIONS */

// open database
var db = openDatabase("Test", "1.0", "Test", 65535);

// create concerns table
db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS concerns "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "name VARCHAR(100) NOT NULL, "
		+ "date DATETIME NOT NULL, " 
		+ "assigned VARCHAR(100) NOT NULL, "
		+ "urgency VARCHAR(100) NOT NULL, "
		+ "notes TEXT NOT NULL, "
		+ "ordering INTEGER, "
		+ "checked DATETIME)"
	transaction.executeSql(
		sql, 
		undefined, 
		function () {}, 
		function (transaction, err) {
			console.error(err);
		}
	);
});

// create doctors table
db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS doctors "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," 
		+ "name VARCHAR(100) NOT NULL, " 
		+ "specialty VARCHAR(100) NOT NULL)"
	transaction.executeSql(
		sql,
		undefined,
		function () {},
		function (transaction, err) {
			console.error(err);
		}
	);
});

// drop tables
$(document).on('tap', '#clear-all-concerns', function () {

	// drop concerns table
	db.transaction (function (transaction) {
		var sql = "DROP TABLE concerns";
		transaction.executeSql(
			sql, 
			undefined, 
			function () {}, 
			function (transaction, err) {
				console.error(err);
			}
		);
	});

	// drop doctors table
	db.transaction (function (transaction) {
		var sql = "DROP TABLE doctors";
		transaction.executeSql(
			sql,
			undefined,
			function () {
				location.reload();
			},
			function (transaction, err) {
				console.error(err);
			}
		);
	});
});

/* DISPLAY FUNCTIONS */

var DEFAULT_SORT = "date";
display_concerns(DEFAULT_SORT)

// display concerns
function display_concerns_filtered(sorted_by, filtered_by) {

	// fix the selector
	$("#concern-list-sort").val(sorted_by).attr('selected', true).siblings('option').removeAttr('selected');
	$('#doctor-select').selectmenu('refresh', true);
	
	db.transaction( function(transaction) {

		var sql = "SELECT * FROM concerns WHERE checked IS NULL"

		// add filtered by params
		if (filtered_by != null) {
			sql += " AND assigned LIKE '%doctor-" + filtered_by + "%'";
		}
		
		// add sorted by params
		if (sorted_by == 'date') {
			sql += " ORDER BY " + sorted_by + ' DESC';
		} else {
			sql += " ORDER BY " + sorted_by;
		}

		transaction.executeSql(
			sql, 
			undefined, 
			function (transaction, result) {
				if (result.rows.length) {

					// remove previous elements
					$("#concern-list").empty();
					$("#no-concern").css("display","none");

					// add each list item
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						if (row.ordering != -1) {
							var color = "99ff99";
							if (row.urgency == "Medium")
								color = "ffff99";
							else if (row.urgency == "High")
								color = "ff9999";
							$("#concern-list").append(
								"<li id='" + row.id + "' class='ui-li-has-alt'>"
								+ "<a style='background-color: #" + color + ";' href='#add-concern' onclick='set_details("+row.id+")' class='ui-btn'>" + row.name + "</a>" 
								+ "<a href='#' class='close ui-btn ui-btn-icon-notext ui-icon-delete'>Delete</a>"
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

// basic display without filter
function display_concerns(sorted_by) {
	display_concerns_filtered(sorted_by, null);
}

// display possible doctors
function display_assigned_choices() {
	db.transaction(function (transaction) {
		var sql = 'SELECT * FROM doctors';
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {
				// check if there are doctors
				if (result.rows.length) {
					$('#no-doctor').css('display', 'none');

					// append html for new doctors
					var doctors_displayed = $('#assigned-choices-other input').length
					for (var i=doctors_displayed; i<result.rows.length; i++) {
						var row = result.rows.item(i);
						var doctorId = 'doctor-' + row.id;
						$('#assigned-choices-other').append(
							"<input type='checkbox' name='" + doctorId + "' id='" + doctorId + "' />"
							+ "<label for='" + doctorId + "'>" + row.name + "</label>"
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

/* ADD FUNCTIONS */

// navigate to *clean* add concern page
$(document).on('tap', '#add-concern-button', function() {

	// delete the values in everything
	$('#concern-name').val('');
 	$('#concern-notes').val('');

	// change heading
	$('#add-concerns-heading').text('New Concern');

	// make everything not disabled
	$('#concern-name').prop('disabled', false).trigger('create');
	$('#date-field').css('display', 'none');
	$('#concern-notes').prop('disabled', false).trigger('create');

	// display button
	$('#add-concern-action').css('display', 'block');
	$('#add-doctor-button').css('display','block');

	$('#edit-notes-button').css('display', 'none');

	// wait for pageshow
	$('#add-concern').on('pageshow', function() {

		// enable checkboxes if not on display-details version
		if ($('#concern-name').val() == "") {
			$('#urgency-choices input').checkboxradio('enable');
			$('#urgency-choices input').prop('checked', false);
			$('#urgency-choices input').checkboxradio('refresh');

			display_assigned_choices();

			$('#assigned-choices input').checkboxradio('enable');
			$('#assigned-choices input').prop('checked', false);
			$('#assigned-choices input').checkboxradio('refresh');
		}
	});
});

// add a doctor
$(document).on('tap', '#add-doctor-action', function () {

	db.transaction(function(transaction) {
		var sql = 'INSERT INTO doctors (name, specialty) VALUES (?, ?)';
		transaction.executeSql(
			sql,
			[$('#doctor-name').val(), $('#doctor-specialty').val()],
			function(transaction, result) {

				// clear value
				$i = result.insertId;
				$('#doctor-name').val('');
				$('#doctor-specialty').val('');

				// display choices with new doctor
				display_assigned_choices();

				// automatically check doctor off
				setTimeout(function() {
					$('#doctor-' + $i).prop('checked', true).checkboxradio('refresh');
				}, 100);
			},

			function(transaction, error) {
				console.error(error);
			}
		);
	})
});

// Add concern action 
$(document).on("tap", "#add-concern-action", function() {

	// get values from form
	var $concern = $("#concern-name").val();
	var $i = 0;
	var urgency = $('#urgency-choices input:checked').attr('id');
	var assigned_checked = $('#assigned-choices input:checked');

	// check if all required fields are filled in
	if (($concern != "") && (urgency != null) && assigned_checked.length > 0) {
		
		// create list of "assgined-to"
		var assigned_to = assigned_checked.attr('id');
		for (var n = 1; n < assigned_checked.length; n++) {
			assigned_to += ',' + $(assigned_checked[n]).attr('id');
		}

		db.transaction(function (transaction) {
			var sql = "INSERT INTO concerns (name, date, assigned, urgency, notes, ordering) VALUES (?, ?, ?, ?, ?, ?)";
			transaction.executeSql(
				sql, 
				[$concern, new Date(), assigned_to, urgency, $('#concern-notes').val(), 0], 
				function(transaction, result) {

					$("#no-concern").css("display","none");
					$i = result.insertId;

					// update ordering
					db.transaction(function (transaction) {
						var sql = "UPDATE concerns SET ordering=" + $("#concern-list").children().size() + " WHERE id=" + $i;
						transaction.executeSql(
							sql, 
							undefined, 
							function () {}, 
							function (transaction, error) {
								console.error("error: " + error.message);
							}
						);
					});

					// clear inputs
					for (var i=0; i < assigned_checked.length; i++) {
						assigned_checked[i].click();
					}
					$('#urgency-choices #High').prop('checked', true);
					$("#concern-name").val("");
					$('#concern-notes').val('');

					// display default
					display_concerns(DEFAULT_SORT);

					// change page
					$.mobile.changePage("#concern-list-view");		
				},

				function (transaction, error) {
					console.error(error);
				}
			);
		});
	} else {
		alert('Please fill in all required fields!');
	}
});

/* REVIEW CONCERNS */

// Remove concern (delete)
$(document).on("tap", "#concern-list.patient-view li a.close", function() {
	
	// get id
	$i = $(this).parent().attr("id");

	// change ordering to -1 in database (basically removes but just hides)
	db.transaction(function (transaction) {
		var sql = "UPDATE concerns SET ordering=-1 WHERE id=" + $i;
		transaction.executeSql(
			sql,
			undefined,
			function () {},
			function (transaction, error) {
				console.error(error);
			}
		);
	});

	// removal animation
	$(this).parent().slideUp('normal', function(){
			$(this).remove();
		}
	);
});

// Mark concern as reviewed during visit
$(document).on("tap", "#concern-list.doctor-view li a.close", function() {
	
	// make the UI animation disabled
	$(this).parent().addClass('ui-disabled');
	
	// mark concern in database as reviewed with review date
	var liId = $(this).parent().attr('id');
	db.transaction(function(transaction) {
		var sql = "UPDATE concerns SET checked='" + new Date() + "' WHERE id='" + liId + "'";
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {},
			function(transaction, err) {
				console.error(err);
			}
		);
	});
});

// sort order of concerns
$(document).bind('pageinit', function() {

	// make it "sortable"
    $( "#concern-list" ).sortable();
    $( "#concern-list" ).disableSelection();
    $( "#concern-list" ).bind( "sortstop", function(event, ui) {
    	
    	// make each sortable
    	var $concernLi = $("#concern-list li");
		
    	// update ordering
		db.transaction(function (transaction) {
			for (var i = 0; i < $concernLi.length; i++) {
				var elementId = $concernLi[i].id;
				var order = i + 1;
				var sql = "UPDATE concerns SET ordering=" + order + " WHERE id=" + elementId;
				transaction.executeSql(
					sql,
					undefined,
					function (transaction, result) {
					},
					function (transaction, error) {
						console.error(error);
					}
				);
			}
		});
		
		// refresh views
		$('ul').listview('refresh');
    	$('#concern-list').listview('refresh');
    });
});

// select order for display
$(function () {
	$('#concern-list-sort').change(function() {

		var selected = $('#concern-list-sort option:selected').val();
		
		// change display
		display_concerns(selected);

	});
});

// set details for given concern!
function set_details(id) {

	// change heading
	$('#add-concerns-heading').text('Concern Details');

	// make everything disabled
	$('#concern-name').prop('disabled', true).trigger('create');
	$('#date-field').css('display','inline');
	$('#concern-notes').prop('disabled', true).trigger('create');

	// show the doctors
	display_assigned_choices();

	// hide the button
	$('#add-concern-action').css('display', 'none');
	$('#add-doctor-button').css('display','none');

	// get values for given concern
	db.transaction(function (transaction) {
		var sql = "SELECT * FROM concerns WHERE id=" + id;
		transaction.executeSql(
			sql,
			undefined,
			function (transaction, result) {

				var item = result.rows.item(0);

				// set id
				$('#concern-id')[0].value = item.id;

				// set name
				$("#concern-name")[0].value = item.name;

				// set date
				$('#detail-date')[0].value = item.date;

				// set assigned to
				var assigned_to = item.assigned.split(',');
				for (var n = 0; n < assigned_to.length; n++) {
					$('#assigned-choices #' + assigned_to[n]).prop('checked', true);
				}
				$('#assigned-choices input').checkboxradio('refresh');
				$('#assigned-choices input').checkboxradio('disable');

				// set urgency
			    $('#urgency-choices ' + '#' + item.urgency).prop('checked', true);
			    $('#urgency-choices input').checkboxradio('refresh');
			    $('#urgency-choices input').checkboxradio('disable');

			    // set notes
			    $('#concern-notes')[0].value = item.notes;
			    $('#edit-notes-button').css('display', 'block');
			},
			function (transaction, error) {
				console.error(error);
			}
		);
	})
}

// put text of notes to edit
$(document).on('tap', '#edit-notes-button', function() {
	$('#edit-notes-field').val($('#concern-notes').val());
})

// save edit notes
$(document).on('tap', '#edit-notes-save', function() {
	var cid = $('#concern-id').val();
	var notesval = $('#edit-notes-field').val();
	db.transaction(function (transaction) {
		var sql = "UPDATE concerns SET notes='" + notesval + "' WHERE id='" + cid + "'";
		transaction.executeSql(
			sql, 
			undefined, 
			function () {}, 
			function (transaction, error) {
				console.error("error: " + error.message);
			}
		);
	});
	$('#concern-notes').val(notesval);
});

/* VISIT FUNCTIONS */

// select which doctor visiting
$(document).on('tap', '#visit-begin-button', function() {

	db.transaction(function (transaction) {
		var sql = 'SELECT * FROM doctors';
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {
				if (result.rows.length) {

					// display possible doctors
					$('#no-doctors-select').css('display', 'none');
					$('#visit-doctor-form').css('display', 'block');
					for (var i=0; i<result.rows.length; i++) {
						var row = result.rows.item(i);
						$('#visit-doctor-select')
							.append("<option value='" + row.id + "'>" + row.name + "</option>")
							.trigger('create');
					}
				}
			},
			function (transaction, err) {
				console.error(err);
			}
		);
	});
})

// after selecting doctor, begin visit
$(document).on('tap', '#visit-doctor-selected', function() {

	// change display of information
	$('#visit-information').css('display', 'block');
	$('#visit-doctor-information').empty();
	var doctorId = $('#visit-doctor-select option:selected').val();

	// get doctor information
	db.transaction(function(transaction) {
		var sql = 'SELECT * FROM doctors WHERE id=' + doctorId;
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {

				// append doctor information
				var doctorInfo = result.rows.item(0);
				$('#visit-doctor-information').append(
					"<h2>" + doctorInfo.name + "</h2>"
					+ "<p>Specialty: " + doctorInfo.specialty
					+ "</p><p>Visit date: " + new Date() + "</p>"
				);

				// display filtered concerns
				display_concerns_filtered(DEFAULT_SORT, doctorId);
			},
			function(transaction, error) {
				console.error(error);
			}
		);
	});

	// hide and display other elements of the page
	$('#concern-list-header').text('Visit')
	$('#add-concern-button').css('display', 'none');
	$('#clear-all-concerns').css('display', 'none');
	$('#visit-begin-button').css('display', 'none');
	$('#concern-list').removeClass('patient-view');
	$('#concern-list').addClass('doctor-view');

	$('#visit-complete-button').css('display', 'block');
	$('#back-concern-view').css('display', 'block');
});

// go back to concern view
$(document).on('tap', '#back-concern-view', function() {
	location.reload();
});

// complete visit
$(document).on('tap', '#visit-complete-button', function() {
	location.reload();
});



