document.currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
})();

$("#feedbackyes").click(function () {
    var formData = {
        'URL': window.location.pathname,
        'Feedback': 'Good',
        'id': $('#mainscript').attr("idval")
            };
// process the form
$.ajax({
    type: 'POST',
    url: '/kb/feedbackprocess.aspx',
    data: formData,
    dataType: 'html',
    encode: true
})
    .done(function (data) {
        //console.log(data); 
        $("#feedbackheader").html(data);
    });
        });

$("#feedbackno").click(function () {
    $("#feedbackheader").hide();
    $("#feedbackform").removeClass("d-none");
    $("#feedbackform").addClass("d-block");
    //$("#feedbackform").slideToggle("slow", function() {
    // Animation complete.
    //});
});

$("#feedbacksubmit").click(function () {
    event.preventDefault();

    var formData = {
        'URL': window.location.pathname,
        'Feedback': 'Bad',
        'Check Incorrect Information': $('#CheckIncorrectInformation').prop('checked'),
        'Check Not Enough Information': $('#CheckNotEnoughInformation').prop('checked'),
        'CheckNotrelatedtomyissue': $('#CheckNotrelatedtomyissue').prop('checked'),
        'Comments': $('#comments').val(),
        'id': $('#mainscript').attr("idval")
            };
// process the form
$.ajax({
    type: 'POST',
    url: '/kb/feedbackprocess.aspx',
    data: formData,
    dataType: 'html',
    encode: true
})
    .done(function (data) {
        console.log(data);

        $("#feedbackheader").html(data);
        $("#feedbackheader").show();
        $("#feedbackform").hide();


    });
           
        });