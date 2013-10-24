// set up database
var db = openDatabase("Test", "1.0", "Test", 65535);

db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS concerns "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "concernName VARCHAR(100) NOT NULL, "
		+ "date DATETIME NOT NULL, " 
		+ "raisedBy VARCHAR(100) NOT NULL, "
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
			alert("Table not created because " + err.message);
		}
	);
});

// application level logic
$(function () {

	// Login logic
	$(document).on("tap", "#loginButton", function () {
		// TODO: Store session information
		// TODO: Check credentials
		$.mobile.changePage("#LandingPage");
	});

	var $concern = $("#taskName");
	var $concernList = $("#concernList");

	// TODO: get information in table
	db.transaction( function(transaction) {
		var sql = "SELECT * FROM concerns ORDER BY concernOrder";
		transaction.executeSql(
			sql, 
			undefined, 
			function(transaction, result) {
				if (result.rows.length) {
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						if (row.concernOrder != -1) {
							var color = "99ff99";
							if (row.urgency == "Medium")
								color = "ffff99";
							else if (row.urgency == "High")
								color = "ff9999";
							$concernList.append(
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
				alert("Oops the error is: " + err.message);
			}
		);
	});

	// Add concern
	$(document).on("tap", "#addConcern", function() {
		var $concern = $("#taskName").val();
		var $i = 0;
		if ($concern != "") {
			var urgency = "High";
			var urgency_list = document.getElementsByName("urgency-choice");
			for (index =0; index < urgency.length; index++) {
				if (urgency[index].checked)
					urgency = urgency[index].id;
			}
			db.transaction(function (transaction) {
				var sql = "INSERT INTO concerns (concernName, date, raisedBy, pendingFor, urgency, concernOrder) VALUES (?, ?, ?, ?, ?, ?)";
				transaction.executeSql(
					sql, 
					[$concern, new Date(), $("#raised-by").val(), $("#pending-for").val(), urgency, 0], 
					function (transaction, result) {
						$("#noErrors").css("display","none");
						$i = result.insertId;

						db.transaction(function (transaction) {
							var sql = "UPDATE concerns SET concernOrder=" + $("#concernList").children().size() + " WHERE id=" + $i;
							transaction.executeSql(
								sql, 
								undefined, 
								function () {}, 
								function (transaction, error) {
									alert("error: " + error.message);
								}
							);
						})
						var color = "#99ff99"
						if (urgency == "Medium")
							color = "ffff99";
						else if (urgency == "High")
							color = "ff9999";
						$concernList.append(
							"<li id='" + $i + "' class='ui-li-has-alt'>"
							+ "<a style='background-color: #" + color + ";' href='#TaskDetails' onclick='set_details("+$i+")' class='ui-btn'>" + $concern + "</a>" 
							+ "<a href='#' data-icon='delete' class='close ui-btn ui-btn-icon-notext ui-icon-delete'>Delete</a>"
							+ "</li>"
						);
						$.mobile.changePage("#TaskView");		
						$("#taskName").val("");
					},
					function (transaction, error) {
						alert("Oops the error is: " + error.message);
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
					alert("error: " + error.message);
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

	// Change doctor information based on selection
	$('#doctor-select').change(function () {
		var selected = $("#doctor-select option:selected").text();
		$("#info-doctor-name").val(selected);
		$('#info-doctor-picture')[0].src = 
			"assets/" + selected.replace('Dr. ', '').replace(' ','') + '.jpg'
		// TODO: Fill in correct information
		// TODO: Change the tasks listed
		// db.transaction( function(transaction) {
		// 	var sql = "SELECT * FROM concerns ORDER BY concernOrder";
		// 	transaction.executeSql(
		// 		sql, 
		// 		undefined, 
		// 		function(transaction, result) {
		// 			if (result.rows.length) {
		// 				for (var i = 0; i < result.rows.length; i++) {
		// 					var row = result.rows.item(i);
		// 					if (row.concernOrder != -1) {
		// 						var color = "99ff99";
		// 						if (row.urgency == "Medium")
		// 							color = "ffff99";
		// 						else if (row.urgency == "High")
		// 							color = "ff9999";
		// 						$concernList.append(
		// 							"<li id='" + row.id + "' class='ui-li-has-alt'>"
		// 							+ "<a style='background-color: #" + color + ";' href='#TaskDetails' onclick='set_details("+row.id+")' class='ui-btn'>" + row.concernName + "</a>" 
		// 							+ "<a href='#' data-icon='delete' class='close ui-btn ui-btn-icon-notext ui-icon-delete'>Delete</a>"
		// 							+ "</li>"
		// 						);
		// 					}
		// 				}
		// 			}
		// 		}, 
		// 		function (transaction, err) {
		// 			alert("Oops the error is: " + err.message);
		// 		}
		// 	);
		// });
		return false
	});

	// Switch view by removing Doctor Information panel
	$(document).on("tap", "#switchView", function() {
		if ($('#doctor-information').is(':visible')) {
			
			// in the Doctor View
			$('#doctor-information').hide();
			$(this).removeClass('ui-btn-active');
			$('#concerns-list-header')[0].innerHTML = "Doctor View";
			$('#switchView')[0].innerHTML = "Patient View";
			$('#concernList').addClass('doctor-view').removeClass('patient-view');

		} else {

			// in the Patient View
			$('#doctor-information').show();
			$(this).removeClass('ui-btn-active');
			$('#concerns-list-header')[0].innerHTML = "Patient View";
			$('#switchView')[0].innerHTML = "Doctor View";
			$('#concernList').removeClass('doctor-view').addClass('patient-view');

		}
		// TODO: change the header for the patient
		// TODO: allow doctor to "check off" different tasks
	});	

	// TODO: Fill in patient-information based on login/session
	// TODO: Fill in doctor-information based on selected doctor on top of page

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
						alert("error: " + error.message);
					}
				);
			}
		});
		$('ul').listview('refresh');
    	$('#concernList').listview('refresh');
    });
});

function set_details(id) {
	db.transaction(function (transaction) {
		var sql = "SELECT * FROM concerns WHERE id=" + id;
		transaction.executeSql(
			sql,
			undefined,
			function (transaction, result) {
				var item = result.rows.item(0);
				$("#detail-concern")[0].value = item.concernName;
			    $("#detail-raised-by")[0].value = item.raisedBy;
			    $('#detail-pending-for')[0].value = item.pendingFor;
			    $('#detail-urgency')[0].value = item.urgency;
			    $('#detail-date')[0].value = item.date;
			},
			function (transaction, error) {
				alert("error: " + error.message);
			}
		);
	})
}
