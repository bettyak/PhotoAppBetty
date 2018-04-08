$(function(){
 
    var tmpl,
    tdata = {};
 
    //Init page
    var initPage = function() {
 
        // Load the HTML template
        $.get("/templates/admin_add_album.html", function(d){
            tmpl = d;
        });
 
        if (readCookie("username")) {
            tdata.username = readCookie("username");
        }


        $(document).ajaxStop(function () {
            var renderedPage = Mustache.to_html( tmpl, tdata );
            $("body").html( renderedPage );
        })    
    }();
});

