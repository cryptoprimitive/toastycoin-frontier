window.addEventListener('load', function() {
  $.get("../beta/navbar.html", function(data){
    $("#nav-placeholder").replaceWith(data);
  });
});