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
		+ "specialty VARCHAR(100) NOT NULL, "
		+ "image VARCHAR(100) NOT NULL)"
	transaction.executeSql(
		sql,
		undefined,
		function () {},
		function (transaction, err) {
			console.error(err);
		}
	);
});

db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS patients " 
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "username VARCHAR(100) NOT NULL, "
		+ "password VARCHAR(100) NOT NULL, " 
		+ "name VARCHAR(100) NOT NULL, "
		+ "age VARCHAR(100) NOT NULL, "
		+ "image VARCHAR (100) NOT NULL, " 
		+ "updated DATETIME NOT NULL)"
	transaction.executeSql(
		sql,
		undefined,
		function () {},
		function (transaction, err) {
			console.error(err);
		}
	);
});

$(document).on("tap", "#createAccount", function() {
	if ($("#username").val() != "" && $("#password").val() != "" && $("#password2").val() != "" 
		&& $("#patientName").val() != "" && $("#patientAge").val() != "" && $("patientImage").val() != ""
		&& $("#password").val() == $("#password2").val()) {
		db.transaction( function (transaction) {
			var sql = "INSERT INTO patients (username, password, name, age, image, updated) VALUES (?, ?, ?, ?, ?, ?)";
			transaction.executeSql(
				sql,
				[$("#username").val(), $("#password").val(), $("#patientName").val(), $("#patientAge").val(), $("patientImage").val(), new Date()],
				function (transaction, result) {
					console.log(result);
				},
				function (transaction, err) {
					console.error(err);
				}
			);
		});
		$.mobile.changePage("#");
	}
	else {
		console.log("There was an error in your inputs!");
		console.log($("#username").val() + $("#password").val() + $("#password2").val() + $("#patientName").val() + $("#patientAge").val() + $("patientImage").val());
	}
});

$(document).on("tap", "#loginButton", function () {
	db.transaction( function (transaction) {
		var sql = "SELECT * FROM patients WHERE username='" + $("#login-user").val() + "' AND password='" + $("#login-password").val() + "'";
		// console.log(sql);
		// var sql = "SELECT * from patients";
		transaction.executeSql(
			sql,
			undefined,
			function (transaction, result) {
				// alert(result.rows.length);
				console.log(result.rows);
				if (result.rows.length != 0) {
					var user = result.rows.item(0);
					localStorage.name = user.name;
					localStorage.age = user.age;
					localStorage.image = user.image;
					localStorage.updated = user.updated;
					
					load_landing_page();
				}
				else {
					alert("There was an error in signing in! Please try again.");
					return false;
				}
			},
			function (transaction, err) {
				console.error(err);
			}
		);
	})
})

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

	// Add concern
	$(document).on("tap", "#addConcern", function() {
		var $concern = $("#taskName").val();
		var $i = 0;
		if ($concern != "") {
			var urgency = "High";
			var urgency_list = document.getElementsByName("urgency-choice");
			// console.log(urgency_list);
			for (index =0; index < urgency_list.length; index++) {
				if (urgency_list[index].checked)
					urgency = urgency_list[index].id;
			}
			db.transaction(function (transaction) {
				var sql = "INSERT INTO concerns (concernName, date, pendingFor, urgency, concernOrder) VALUES (?, ?, ?, ?, ?)";
				transaction.executeSql(
					sql, 
					[$concern, new Date(), $("#pending-for").val(), urgency, 0], 
					function (transaction, result) {
						console.log([$concern, new Date(), $("#pending-for").val(), urgency, 0]);
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
						display_concerns(DEFAULT_SORT);
						$.mobile.changePage("#TaskView");		
						$("#taskName").val("");
					},
					function (transaction, error) {
						console.error(error);
					}
				);
			});
		}
		else {
			alert("Please enter a concern");
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
				$("#detail-concern")[0].value = item.concernName;
			    // $("#detail-raised-by")[0].value = item.raisedBy;
			    $('#detail-pending-for')[0].value = item.pendingFor;
			    $('#detail-urgency')[0].value = item.urgency;
			    $('#detail-date')[0].value = item.date;
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
		var sql = "SELECT * FROM concerns ORDER BY " + sorted_by;
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