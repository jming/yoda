$(function () {

	var i = Number(localStorage.getItem('task-counter')) + 1;
	//var i = 1;
	var j, k, orderList;
	var $task = $("#taskName");
	var $concernList = $("#concernList");
	var order = [];
	orderList = localStorage.getItem('task-orders');
	
	if(!orderList){
		$("#noErrors").css("display","block");
	}
	
	// Load todo list
	orderList = orderList ? orderList.split(',') : [];   
	for( j = 0, k = orderList.length; j < k; j++) {
		$concernList.append(
			"<li id='" + orderList[j] + "'>"
			+ "<a href='#TaskDetails' onclick='set_details("+orderList[j]+")'>" 
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
			$concernList.append(
				"<li id='" + i + "'>"
				+ "<a href='#TaskDetails' onclick='set_details("+i+")'>" + localStorage.getItem("task-"+i) + "</a>" 
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
