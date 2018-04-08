$(function(){
 
    var tmpl,
    tdata = {};
 
    // Init page
    var initPage = function() {
 
        // Load the HTML template
        $.get("/templates/login.html", function(d){
            tmpl = d;
        });


        $(document).ajaxStop(function () {
            var renderedPage = Mustache.to_html( tmpl, tdata );
            $("body").html( renderedPage );
        });
    }();
});
