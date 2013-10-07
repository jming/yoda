// set up database
var db = openDatabase("Test", "1.0", "Test", 65535);

db.transaction (function (transaction) {
	var sql = "CREATE TABLE IF NOT EXISTS users "
		+ " (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "
		+ "username VARCHAR(100) NOT NULL, "
		+ "password VARCHAR(100) NOT NULL)"
	transaction.executeSql(
		sql, 
		undefined, 
		function () {
			// alert("Table created!");
		}, 
		function (transaction, err) {
			// alert("Table not created because " + err.message);
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

	var i = Number(localStorage.getItem('task-counter')) + 1;
	//var i = 1;
	var j, k, orderList;
	var $task = $("#taskName");
	var $concernList = $("#concernList");
	var order = [];
	var color = {}
	orderList = localStorage.getItem('task-orders');
	
	if(!orderList){
		$("#noErrors").css("display","block");
	}
	
	// Load todo list
	orderList = orderList ? orderList.split(',') : [];   
	for( j = 0, k = orderList.length; j < k; j++) {
		var urgency = localStorage.getItem("task-" + orderList[j] + "-urgency");
		var color = "99ff99"
		if (urgency == "Medium")
			color = "ffff99";
		else if (urgency == "High")
			color = "ff9999";
		$concernList.append(
			"<li id='" + orderList[j] + "'>"
			+ "<a style='background-color: #" + color + ";' href='#TaskDetails' onclick='set_details("+orderList[j]+")'>" 
			+ localStorage.getItem("task-" + orderList[j]) + "</a>" 
			+ "<a href='#' data-icon='delete' class='close'>Delete</a>"
			+ "</li>"
		);
	}

	// Add Task 
	$(document).on("tap", "#addTask", function() {
		if($task.val() != ""){
			localStorage.setItem("task-"+i, $task.val());
			localStorage.setItem("task-"+i+"-raised-by", $("#raised-by").val());
			localStorage.setItem("task-"+i+"-pending-for", $("#pending-for").val());
			urgency = document.getElementsByName("urgency-choice");
			for (index =0; index < urgency.length; index++) {
				if (urgency[index].checked)
					localStorage.setItem("task-"+i+"-urgency", urgency[index].id);
			}
			var currentdate = new Date();
			localStorage.setItem("task-"+i+"-date", currentdate);
			localStorage.setItem("task-counter",i);
			$("#noErrors").css("display","none");
			var urgency = localStorage.getItem("task-" + i + "-urgency");
			var color = "99ff99"
			if (urgency == "Medium")
				color = "ffff99";
			else if (urgency == "High")
				color = "ff9999";
			$concernList.append(
				"<li id='" + i + "'>"
				+ "<a style='background-color: #" + color + ";' href='#TaskDetails' onclick='set_details("+i+")'>" + localStorage.getItem("task-"+i) + "</a>" 
				+ "<a href='#' data-icon='delete' class='close'>Delete</a>"
				+ "</li>"
			);
			$.mobile.changePage("#TaskView");		
			listTasks();
			$task.val("");
			
			i++
		} else {
			alert("Please enter a concern");
		}
		return false;
	});	

	// Remove Task
	$(document).on("tap", "#concernList li a.close", function() {
		//alert($(this).parent().attr("id"));
		localStorage.removeItem($(this).parent().attr("id"));
		 $(this).parent().slideUp('normal', function(){
				$(this).remove();
				listTasks();
			});
		 	
		return false;
	});

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

		// TODO: Change the tasks listed
		
		return false
	});

	// Switch view by removing Doctor Information panel
	$(document).on("tap", "#switchView", function() {
		$('#doctor-information').toggle();
		$(this).removeClass("ui-btn-active");
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
