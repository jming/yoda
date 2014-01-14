// set up database
var db = openDatabase("Test", "1.0", "Test", 65535);

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

// navigate to add concern page
$(document).on('tap', '#add-concern-button', function() {
	// delete the values in everything
	$('#concernName').val('');
 	$('#concern-notes').val('');
	// change heading
	$('#add-concerns-heading').text('New Concern');
	// make everything not disabled
	$('#concernName').prop('disabled', false).trigger('create');
	$('#date-field').css('display', 'none');
	$('#concern-notes').prop('disabled', false).trigger('create');
	$('#add-concern-action').css('display', 'block');
	$('#add-doctor-button').css('display','block');

	$('#add-concern').on('pageshow', function() {
		if ($('#concernName').val() == "") {
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
		var sql = 'INSERT INTO doctors (name, specialty) VALUES (?, ?)';
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
					$('#no-doctor').css('display', 'none');
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

// Add concern
$(document).on("tap", "#add-concern-action", function() {
	var $concern = $("#concernName").val();
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
			var sql = "INSERT INTO concerns (name, date, assigned, urgency, notes, ordering) VALUES (?, ?, ?, ?, ?, ?)";
			transaction.executeSql(
				sql, 
				[$concern, new Date(), assigned_to, urgency, $('#concern-notes').val(), 0], 
				function(transaction, result) {
					console.log([$concern, new Date(), assigned_to, urgency, 0]);
					$("#no-concern").css("display","none");
					$i = result.insertId;

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
					// TODO: clear all inputs

					for (var i=0; i < assigned_checked.length; i++) {
						assigned_checked[i].click();
					}
					$('#urgency-choices #High').prop('checked', true);

					display_concerns(DEFAULT_SORT);
					$.mobile.changePage("#concern-list-view");		
					$("#concernName").val("");
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


// Remove concern
$(document).on("tap", "#concern-list.patient-view li a.close", function() {
	$i = $(this).parent().attr("id");
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
	$(this).parent().slideUp('normal', function(){
			$(this).remove();
		}
	);
	 	
	return false;
});

// Disable concern during visit
$(document).on("tap", "#concern-list.doctor-view li a.close", function() {
	$(this).parent().addClass('ui-disabled');
	// TODO: change in database
	var liId = $(this).parent().attr('id');
	console.log('id', $(this).parent().attr('id'));
	db.transaction(function(transaction) {
		var sql = "UPDATE concerns SET checked='" + new Date() + "' WHERE id='" + liId + "'";
		console.log('concern-list change sql', sql);
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

// sort order of concerns
$(document).bind('pageinit', function() {

    $( "#concern-list" ).sortable();
    $( "#concern-list" ).disableSelection();
    $( "#concern-list" ).bind( "sortstop", function(event, ui) {
    	var $concernLi = $("#concern-list li");
		db.transaction(function (transaction) {
			for (var i = 0; i < $concernLi.length; i++) {
				var elementId = $concernLi[i].id;
				var order = i + 1;
				var sql = "UPDATE concerns SET ordering=" + order + " WHERE id=" + elementId;
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
    	$('#concern-list').listview('refresh');
    });
});

// select order for display
$(function () {
	$('#concern-list-sort').change(function() {

		var selected = $('#concern-list-sort option:selected').val();
		display_concerns(selected);

		return false
	});
})

// set details for given concern!
function set_details(id) {

	// change heading
	$('#add-concerns-heading').text('Concern Details');
	// make everything disabled
	$('#concernName').prop('disabled', true).trigger('create');
	$('#date-field').css('display','inline');
	$('#concern-notes').prop('disabled', true).trigger('create');
	// show the doctors
	display_assigned_choices();
	// hide the button
	$('#add-concern-action').css('display', 'none');
	$('#add-doctor-button').css('display','none');
	db.transaction(function (transaction) {
		var sql = "SELECT * FROM concerns WHERE id=" + id;
		transaction.executeSql(
			sql,
			undefined,
			function (transaction, result) {
				// console.log('inside set details')
				var item = result.rows.item(0);
				// console.log(item.assigned, item.urgency)
				$("#concernName")[0].value = item.name;
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
	$("#concern-list-sort").val(sorted_by).attr('selected', true).siblings('option').removeAttr('selected');
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
					$("#concern-list").empty();
					$("#no-concern").css("display","none");
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

function display_concerns(sorted_by) {
	display_concerns_filtered(sorted_by, null);
}

$(document).on('tap', '#visit-begin-button', function() {
	console.log('visit-begin-button tapped');
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
					"<h2>" + doctorInfo.name + "</h2>"
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

	$('#concern-list-header').text('Visit')
	$('#add-concern-button').css('display', 'none');
	$('#clear-all-concerns').css('display', 'none');
	$('#visit-begin-button').css('display', 'none');
	$('#concern-list').removeClass('patient-view');
	$('#concern-list').addClass('doctor-view');

	$('#visit-complete-button').css('display', 'block');
	$('#back-concern-view').css('display', 'block');
});

$(document).on('tap', '#back-concern-view', function() {
	location.reload();
});

$(document).on('tap', '#visit-complete-button', function() {
	location.reload();
});



