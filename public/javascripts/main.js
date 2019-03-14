google.charts.load('current', {'packages':['corechart','bar']});
//-----------------------------------------------------------------------
$(document).ready(function(){
			$("#menu").click(function(){
				$("#navi").css("width","100%");
				$("#close").show();
			});
			$("#close").click(function(){
				$("#navi").css("width","0%");
				$("#close").hide();
			});
			$("#login").click(function(){
				$("#log").show();
			});
			$("#signup").click(function(){
				$("#sign").show();
			});
			$("#in-cl").click(function(){
				$("#log").hide();
				$("#log").find("input[type=text],input[type=password]").val("");
				$("#theme").prop("selectedIndex",0);
				$(".cb")[0].checked = false;
			});
			$("#in-cc").click(function(){
				$("#log").hide();
				$("#log").find("input[type=text],input[type=password]").val("");
				$("#theme").prop("selectedIndex",0);
				$(".cb")[0].checked = false;
			});
			$("#up-cl").click(function(){
				$("#sign").hide();
				$("#sign").find("input[type=text],input[type=password],input[type=email]").val("");
				$("#up-m").prop("checked",false);
				$("#up-f").prop("checked",false);
				$(".cb")[1].checked = false;
			});
			$("#up-cc").click(function(){
				$("#sign").hide();
				$("#sign").find("input[type=text],input[type=password],input[type=email]").val("");
				$("#up-m").prop("checked",false);
				$("#up-f").prop("checked",false);
				$(".cb")[1].checked = false;
			});
//-------------------------------------------			
		});
		JQUERY = {
			showAlert: function(message){
				var snackbar = $("#snackbar");
				snackbar.css("fontFamily","Cousine");
				snackbar.html(message);
				snackbar.toggleClass("show");
				setTimeout(function(){
					snackbar.toggleClass("show");
				},3000);
			},
			showPW: function(id){
				if($(id).prop("type") == "password"){
					$(id).prop("type","text");
				} else {
					$(id).prop("type","password");
				}
			},
			checkLogin: function(){
				var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)login\s*\=\s*([^;]*).*$)|^.*$/, "$1");
				if(cookieValue == "true"){
					$("#personimage").show();
					$("#login").hide();
					$("#signup").hide();
				}
			},
			display: function(){
				$("#personimage").hide();
				$("#logout").show();
			},
			showIm: function(){
				$("#personimage").show();
				$("#logout").hide();
			},
			displayOverallChart: function(){
				$.ajaxSettings.async = false;
				var overall = null;
				if($("#overallchart option:selected").val()=="0"){
					$.getJSON('/getOverallData',function(data){
						overall = data["bar"];
					});
					$("#overall").css("width","70%");
					$("#overall").css("height","50%");
					var data = google.visualization.arrayToDataTable(overall);
					//console.log(data);
					var options = {
						'title':'Overall Revision By Year And User Type'
					};
					var chart = new google.charts.Bar($("#overall")[0]);
					chart.draw(data, google.charts.Bar.convertOptions(options));
				}else{
					$.getJSON('/getOverallData',function(data){
						overall = data["pie"];
						$("#overall").css("width","70%");
						$("#overall").css("height","70%");
						var data = google.visualization.arrayToDataTable(overall);
						//console.log(data);
						var options = {
							'title':'Overall Revision By User Type',
							is3D:true
						};
						var chart = new google.visualization.PieChart($("#overall")[0]);
						chart.draw(data, options);
					});
				}
			},displayIndividualChart: function(){
				$.ajaxSettings.async = false;
				var individual = null;
				let title = $("#t").text();
				if(title == undefined || title.length == 0){
					alert("Please select an article to analyse!");
					return;
				}
				if($("#individualchart option:selected").val()=="0"){
					$.getJSON('/getIndividualData/'+title,function(data){
						individual = data["bar"];
					});
					$("#individual").css("width","70%");
					$("#individual").css("height","50%");
					var data = google.visualization.arrayToDataTable(individual);
					//console.log(data);
					var options = {
						'title':'Individual Revision By Year And User Type'
					};
					var chart = new google.charts.Bar($("#individual")[0]);
					chart.draw(data, google.charts.Bar.convertOptions(options));
				}else{
					let selected = $("input[name='topuser']:checked");
					if($("#individualchart option:selected").val()=="2" && selected.length == 0){
						alert("Please select at least one user to analyse!");
						return;
					}
					$.getJSON('/getIndividualData/'+title,function(data){
						if($("#individualchart option:selected").val()=="1"){
							individual = data["pie"];
							$("#individual").css("width","70%");
							$("#individual").css("height","70%");
							var data = google.visualization.arrayToDataTable(individual);
							//console.log(data);
							var options = {
									'title':'Individual Revision By User Type',
									is3D:true
							};
							var chart = new google.visualization.PieChart($("#individual")[0]);
							chart.draw(data, options);
						}else{
							individual = data["topfive"];
							let head = individual[0];
							let indexes = [0];
							for(let i = 0; i < head.length; i++){
								for(let j = 0; j < selected.length; j++){
									if(head[i] == selected[j].value) indexes.push(i);
								}
							}
							let result = [];
							for(let i = 0; i < individual.length; i++){
								let temp = [];
								for(let j = 0; j < individual[i].length; j++){
									for(let k = 0; k < indexes.length; k++){
										if(j == indexes[k]){
											temp.push(individual[i][j]);
										}
									}
								}
								result.push(temp);
							}
							$("#individual").css("width","70%");
							$("#individual").css("height","50%");
							var data = google.visualization.arrayToDataTable(result);
							//console.log(data);
							var options = {
								'title':'Individual Revision By Year And Specific User'
							};
							var chart = new google.charts.Bar($("#individual")[0]);
							chart.draw(data, google.charts.Bar.convertOptions(options));
						}
					});
				}
			}
		}

		
		
