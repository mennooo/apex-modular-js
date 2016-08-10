apex.jQuery(document).ready(function(){

  // Show message on button click
  $('#MESSAGE').on('click', function() {
    kscope.message.info({
      title: "Hi Kscope",
      text: "Now I'm loaded by the page.js"
    });
  });

});
