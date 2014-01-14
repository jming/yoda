// set up database
var db = openDatabase("Test", "1.0", "Test", 65535);

db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS concerns "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "concernName VARCHAR(100) NOT NULL, "
		+ "date DATETIME NOT NULL, " 
		+ "assigned VARCHAR(100) NOT NULL, "
		+ "urgency VARCHAR(100) NOT NULL, "
		+ "notes TEXT NOT NULL, "
		+ "concernOrder INTEGER, "
		+ "checked DATETIME)"
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
	transaction.executeSql(
		sql,
		undefined,
		function () {},
		function (transaction, err) {
			console.error(err);
		}
	);
});

$(document).on('tap', '#clear-all-concerns', function () {
	db.transaction (function (transaction) {
		var sql = "DROP TABLE concerns";
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
	// delete the values in everything
	$('#taskName').val('');
 	$('#concern-notes').val('');
	// change heading
	$('#add-tasks-heading').text('New Concern');
	// make everything not disabled
	$('#taskName').prop('disabled', false).trigger('create');
	$('#date-field').css('display', 'none');
	$('#concern-notes').prop('disabled', false).trigger('create');
	$('#addConcern').css('display', 'block');
	$('#addDoctorButton').css('display','block');

	$('#AddTasks').on('pageshow', function() {
		if ($('#taskName').val() == "") {
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
	console.log('derp');
	db.transaction(function(transaction) {
		var sql = 'INSERT INTO doctors (doctorName, specialty) VALUES (?, ?)';
		transaction.executeSql(
			sql,
			[$('#doctor-name').val(), $('#doctor-specialty').val()],
			function(transaction, result) {
				$i = result.insertId;
				$('#doctor-name').val('');
				$('#doctor-specialty').val('');
				display_assigned_choices();
				setTimeout(function() {
					console.log('here', 'doctor-' + $i);
					$('#doctor-' + $i).prop('checked', true).checkboxradio('refresh');
				}, 100);
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
					var doctors_displayed = $('#assigned-choices-other input').length
					for (var i=doctors_displayed; i<result.rows.length; i++) {
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
	var urgency = $('#urgency-choices input:checked').attr('id');
	var assigned_checked = $('#assigned-choices input:checked');
	if (($concern != "") && (urgency != null) && assigned_checked.length > 0) {
		
		var assigned_to = assigned_checked.attr('id');
		for (var n = 1; n < assigned_checked.length; n++) {
			assigned_to += ',' + $(assigned_checked[n]).attr('id');
		}
		console.log(assigned_to);
		db.transaction(function (transaction) {
			var sql = "INSERT INTO concerns (concernName, date, assigned, urgency, notes, concernOrder) VALUES (?, ?, ?, ?, ?, ?)";
			transaction.executeSql(
				sql, 
				[$concern, new Date(), assigned_to, urgency, $('#concern-notes').val(), 0], 
				function(transaction, result) {
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
					$('#urgency-choices #High').prop('checked', true);

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
		alert('Please fill in all required fields!');
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
	var liId = $(this).parent().attr('id');
	console.log('id', $(this).parent().attr('id'));
	db.transaction(function(transaction) {
		var sql = "UPDATE concerns SET checked='" + new Date() + "' WHERE id='" + liId + "'";
		console.log('concernlist change sql', sql);
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {
				console.log(result);
			},
			function(transaction, err) {
				console.error(err);
			}
		);
	});
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

	// change heading
	$('#add-tasks-heading').text('Concern Details');
	// make everything disabled
	$('#taskName').prop('disabled', true).trigger('create');
	$('#date-field').css('display','inline');
	$('#concern-notes').prop('disabled', true).trigger('create');
	// show the doctors
	display_assigned_choices();
	// hide the button
	$('#addConcern').css('display', 'none');
	$('#addDoctorButton').css('display','none');
	db.transaction(function (transaction) {
		var sql = "SELECT * FROM concerns WHERE id=" + id;
		transaction.executeSql(
			sql,
			undefined,
			function (transaction, result) {
				// console.log('inside set details')
				var item = result.rows.item(0);
				// console.log(item.pendingFor, item.urgency)
				$("#taskName")[0].value = item.concernName;
				$('#detail-date')[0].value = item.date;
				var assigned_to = item.assigned.split(',');
				console.log(assigned_to);
				for (var n = 0; n < assigned_to.length; n++) {
					$('#assigned-choices #' + assigned_to[n]).prop('checked', true);
				}
				$('#assigned-choices input').checkboxradio('refresh');
				$('#assigned-choices input').checkboxradio('disable');
			    $('#urgency-choices ' + '#' + item.urgency).prop('checked', true);
			    $('#urgency-choices input').checkboxradio('refresh');
			    $('#urgency-choices input').checkboxradio('disable');
			    $('#concern-notes')[0].value = item.notes;
			},
			function (transaction, error) {
				console.error(error);
			}
		);
	})
}

function display_concerns_filtered(sorted_by, filtered_by) {

	// fix the selector
	$("#sort-concerns").val(sorted_by).attr('selected', true).siblings('option').removeAttr('selected');
	$('#doctor-select').selectmenu('refresh', true);

	console.log('displaying concerns sorted by ' + sorted_by + ' filtered by ' + filtered_by);
	
	db.transaction( function(transaction) {
		var sql = "SELECT * FROM concerns WHERE checked IS NULL"
		if (filtered_by != null) {
			sql += " AND assigned LIKE '%doctor-" + filtered_by + "%'";
		}
		if (sorted_by == 'date') {
			sql += " ORDER BY " + sorted_by + ' DESC';
		} else {
			sql += " ORDER BY " + sorted_by;
		}
		console.log('display_concerns_filtered sql ' + sql);
		transaction.executeSql(
			sql, 
			undefined, 
			function (transaction, result) {
				console.log(result.rows);
				if (result.rows.length) {
					$("#concernList").empty();
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
								+ "<a style='background-color: #" + color + ";' href='#AddTasks' onclick='set_details("+row.id+")' class='ui-btn'>" + row.concernName + "</a>" 
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

function display_concerns(sorted_by) {
	display_concerns_filtered(sorted_by, null);
}

$(document).on('tap', '#begin-visit-button', function() {
	console.log('begin-visit-button tapped');
	// $('#visit-prepare-doctors').popup();
	// setTimeout(function() {
		
	// }, 0);

	//fill visit-doctor-select
	db.transaction(function (transaction) {
		var sql = 'SELECT * FROM doctors';
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {
				if (result.rows.length) {
					$('#no-doctors-select').css('display', 'none');
					$('#visit-doctor-form').css('display', 'block');
					for (var i=0; i<result.rows.length; i++) {
						var row = result.rows.item(i);
						$('#visit-doctor-select')
							.append("<option value='" + row.id + "'>" + row.doctorName + "</option>")
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

$(document).on('tap', '#visit-doctor-selected', function() {

	$('#visit-information').css('display', 'block');
	$('#visit-doctor-information').empty();
	var doctorId = $('#visit-doctor-select option:selected').val();
	console.log(doctorId);
	db.transaction(function(transaction) {
		var sql = 'SELECT * FROM doctors WHERE id=' + doctorId;
		transaction.executeSql(
			sql,
			undefined,
			function(transaction, result) {
				var doctorInfo = result.rows.item(0);
				console.log(doctorInfo);
				$('#visit-doctor-information').append(
					"<h2>" + doctorInfo.doctorName + "</h2>"
					+ "<p>Specialty: " + doctorInfo.specialty
					+ "</p><p>Visit date: " + new Date() + "</p>"
					// TODO: change formatting of date
				);
				display_concerns_filtered(DEFAULT_SORT, doctorId);
			},
			function(transaction, error) {
				console.error(error);
			}
		);
	});

	$('#concerns-list-header').text('Visit')
	$('#add-concern-button').css('display', 'none');
	$('#clear-all-concerns').css('display', 'none');
	$('#begin-visit-button').css('display', 'none');
	$('#concernList').removeClass('patient-view');
	$('#concernList').addClass('doctor-view');

	$('#visit-complete-button').css('display', 'block');
	$('#back-task-view').css('display', 'block');
});

$(document).on('tap', '#back-task-view', function() {
	location.reload();
});

$(document).on('tap', '#visit-complete-button', function() {
	location.reload();
});



