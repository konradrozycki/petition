(function () {
    var canvas = $("#myCanvas");
    var submit = $(".submit");
    var signature = $("#signature");
    var ctx = canvas[0].getContext("2d");

    canvas.on("mousedown", function (event) {
        var startLeft = event.clientX - canvas.offset().left;
        var startTop = event.clientY - canvas.offset().top;
        ctx.beginPath();
        ctx.moveTo(startLeft, startTop);
        draw();
    });

    function draw() {
        canvas.on("mousemove", function (event) {
            var left = event.clientX - canvas.offset().left;
            var top = event.clientY - canvas.offset().top;
            ctx.lineTo(left, top);
            ctx.stroke();
        });

        canvas.on("mouseup", function () {
            ctx.closePath();
            canvas.off("mousemove");
        });
    }

    submit.on("click", function () {
        var dataUrl = canvas[0].toDataURL("image/png", 0.1);
        console.log(dataUrl);
        signature.val(dataUrl);
    });
})();
