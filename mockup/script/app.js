// set up database
var db = openDatabase("Test", "1.0", "Test", 65535);

// TODO: figure out if this will just open the users table
db.transaction (function (transaction) {
	// var sql = "CREATE TABLE IF NOT EXISTS users "
	// 	+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
	// 	+ "username VARCHAR(100) NOT NULL, "
	// 	+ "password VARCHAR(100) NOT NULL)"
	var sql = "CREATE TABLE IF NOT EXISTS concerns "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "concernName VARCHAR(100) NOT NULL, "
		+ "date DATETIME NOT NULL, " 
		+ "raisedBy VARCHAR(100) NOT NULL, "
		+ "pendingFor VARCHAR(100) NOT NULL, "
		+ "urgency VARCHAR(100) NOT NULL) "
		// + "taskOrder INTEGER NOT NULL)"
	// var sql = "DROP TABLE concerns";
	transaction.executeSql(
		sql, 
		undefined, 
		function () {
			// alert("Table created!");
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

	// var i = Number(localStorage.getItem('task-counter')) + 1;
	// //var i = 1;
	// var j, k, orderList;
	var $concern = $("#taskName");
	var $concernList = $("#concernList");
	// var order = [];
	// var color = {}
	// orderList = localStorage.getItem('task-orders');
	
	// if(!orderList){
	// 	$("#noErrors").css("display","block");
	// }

	// TODO: get information in table
	db.transaction( function(transaction) {
		// TODO: get order
		var sql = "SELECT * FROM concerns";
		transaction.executeSql(
			sql, 
			undefined, 
			function(transaction, result) {
				if (result.rows.length) {
					for (var i = 0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						var color = "#99ff99";
						if (row.urgency == "Medium")
							color = "#ffff99";
						else if (row.urgency == "High")
							color = "#ff9999";
						$concernList.append(
							"<li id='" + row.id + "'>"
							+ "<a style='background-color: " + color + ";' href='#TaskDetails' onclick='set_details(" + row.id + ")'>"
							+ row.concernName + "</a>"
							+ "<a href='#' data-icon='delete' class='close'>Delete</a>"
							+ "</li>"
						);
					}
				}
			}, 
			function (transaction, err) {
				alert("Oops the error is: " + err.message);
			}
		);
	});

	$(document).on("tap", "#addConcern", function() {
		var $concern = $("#taskName").val();
		var $i = 0;
		// alert("Tapped! +" $("#taskName").val());
		if ($concern != "") {
			// alert("derp");
			var urgency = "High";
			var urgency_list = document.getElementsByName("urgency-choice");
			for (index =0; index < urgency.length; index++) {
				if (urgency[index].checked)
					urgency = urgency[index].id;
			}
			db.transaction(function (transaction) {
				var sql = "INSERT INTO concerns (concernName, date, raisedBy, pendingFor, urgency) VALUES (?, ?, ?, ?, ?)";
				transaction.executeSql(
					sql, 
					[$concern, new Date(), $("#raised-by").val(), $("#pending-for").val(), urgency], 
					function (transaction, result) {
						// alert("Concern inserted!");
						$("#noErrors").css("display","none");
						$i = result.insertId;

						// var urgency = localStorage.getItem("task-" + i + "-urgency");
						var color = "#99ff99"
						if (urgency == "Medium")
							color = "ffff99";
						else if (urgency == "High")
							color = "ff9999";
						$concernList.append(
							"<li id='" + $i + "'>"
							+ "<a style='background-color: #" + color + ";' href='#TaskDetails' onclick='set_details("+$i+")'>" + $concern + "</a>" 
							+ "<a href='#' data-icon='delete' class='close'>Delete</a>"
							+ "</li>"
						);
						$.mobile.changePage("#TaskView");		
						// listTasks();
						$("#taskName").val("");
						// console.log(result);
						// console.log([$concern, new Date(), $("#raised-by").val(), $("#pending-for").val(), urgency]);	
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
		//alert($(this).parent().attr("id"));
		localStorage.removeItem($(this).parent().attr("id"));
		 $(this).parent().slideUp('normal', function(){
				$(this).remove();
				listTasks();
			});
		 	
		return false;
	});

	// Disable Task during visit
	$(document).on("tap", "#concernList.doctor-view li a.close", function() {
		//alert($(this).parent().attr("id"));
		$(this).parent().addClass('ui-disabled');
		 	
		return false;
	});

	// create new list based on ordering on the UI
	function listTasks(){
		var $taskLi = $("#concernList li");
		order.length = 0;
		
		$taskLi.each(function(){
			var id = $(this).attr("id");
			order.push(id);
		});
		$('ul').listview('refresh');
		localStorage.setItem("task-orders", order.join(","));	
	}

	// Change doctor information based on selection
	$('#doctor-select').change(function () {
		var selected = $("#doctor-select option:selected").text();
		$("#info-doctor-name").val(selected);
		$('#info-doctor-picture')[0].src = 
			"assets/" + selected.replace('Dr. ', '').replace(' ','') + '.jpg'
		// TODO: Fill in correct information
		// TODO: Change the tasks listed
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

$(document).bind('pageinit', function() {
    $( "#concernList" ).sortable();
    $( "#concernList" ).disableSelection();
    $( "#concernList" ).bind( "sortstop", function(event, ui) {
    	var $taskLi = $("#concernList li");
    	order = []
		order.length = 0;
		
		$taskLi.each(function(){
			var id = $(this).attr("id");
			order.push(id);
		});
		$('ul').listview('refresh');
		localStorage.setItem("task-orders", order.join(","));
    	$('#concernList').listview('refresh');
    });
});

function set_details(id) {
    $("#detail-concern")[0].value = localStorage.getItem("task-"+id);
    $("#detail-raised-by")[0].value = localStorage.getItem("task-"+id+"-raised-by");
    $('#detail-pending-for')[0].value = localStorage.getItem("task-"+id+"-pending-for");
    $('#detail-urgency')[0].value = localStorage.getItem("task-"+id+"-urgency");
    $('#detail-date')[0].value = localStorage.getItem("task-"+id+"-date");
}
