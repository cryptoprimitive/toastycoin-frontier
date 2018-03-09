window.addEventListener('load',function() {
  $('[data-toggle="popover"]').popover()
  $('[data-toggle="popover"]').on('click', function(e) {e.preventDefault(); return true;});
});