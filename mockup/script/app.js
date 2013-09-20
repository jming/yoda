$(function(){
	 //localStorage.clear();
	var i = Number(localStorage.getItem('task-counter')) + 1;
	//var i = 1;
	var j, k, orderList;
	var $task = $("#taskName");
	var $taskList = $("#tasks");
	var order = [];
	orderList = localStorage.getItem('task-orders');
	
	if(!orderList){
		$("#noErrors").css("display","block");
	}
	
	// Load todo list
	orderList = orderList ? orderList.split(',') : [];   
	for( j = 0, k = orderList.length; j < k; j++) {
		$taskList.append(
			"<li id='" + orderList[j] + "'>"
			+ "<a class='editable' data-split-theme='a'>"
			+ "<img src='t.png' alt='Task' class='ui-li-icon ui-li-thumb'>"	
			+ localStorage.getItem(orderList[j]) 
			+ "</a> <a href='#' class='close' data-icon='delete' data-theme='a'>X</a></li>"
		);
	}

	// Add Task 
	$("#addTask").live("tap", function() {
		if($task.val() != ""){
			localStorage.setItem("task-"+i, $task.val());
			localStorage.setItem("task-"+i+"-raised-by", $("#raised-by").val());
			localStorage.setItem("task-"+i+"-pending-for", $("#pending-for").val());
			urgency = document.getElementsByName("urgency-choice");
			for (index =0; index < urgency.length; index++) {
				if (urgency[index].checked)
					localStorage.setItem("task-"+i+"-urgency", urgency[index].id);
			}
			localStorage.setItem("task-counter",i);
			$("#noErrors").css("display","none");
			$taskList.append(
				"<li id='task-" + i + "'>" 
				+ "<a href='#TaskDetails' class='editable' data-split-theme='a' onclick='set_details(" +i+ ")'>"
				+  "<img src='t.png' alt='Task' class='ui-li-icon ui-li-thumb'>"
				+ localStorage.getItem("task-" + i) 
				+ " </a><a href='#' data-icon='delete' class='close' data-theme='a'>Delete</a></li>"
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
	$("#tasks li a.close").live("tap", function() {
		//alert($(this).parent().attr("id"));
		localStorage.removeItem($(this).parent().attr("id"));
		 $(this).parent().slideUp('normal', function(){
				$(this).remove();
				listTasks();
			});
		 	
		return false;
	});
	
	function listTasks(){
		var $taskLi = $("#tasks li");
		order.length = 0;
		
		$taskLi.each(function(){
			var id = $(this).attr("id");
			order.push(id);
		});
		$('ul').listview('refresh');
		localStorage.setItem("task-orders", order.join(","));	
	}	
});