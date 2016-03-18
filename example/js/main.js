/**
 * Created by GaborK on 14/03/16.
 */



window.onload = function(){

    var regex = /".*?"/g;

    $('p').each(function(){
        var _this = this;
        var matches = $(this).text().match(regex);
        if(matches){
            matches.forEach(function(match){
                var element = $('<span>').text(match).addClass('quote')[0].outerHTML;
                var newHTML =  $(_this).html().replace(match, element);
                $(_this).html(newHTML);
            });
        }
    });



    var images = [      "DWave_128chip.jpg",
                        "minivac-completo.jpg",
                        "server_room.jpg",
                        "Ssc2003-06c.jpg",
                        "multivac.jpg",
                        "susanne_posel_news_-super-computer-321243-910x512.jpg"
    ];


    var ps = $('p');
    images.forEach(function(src){


        $('<img>').attr('src', 'imgs/' + src).insertAfter(  ps.get(  Math.floor( Math.random() * ps.length  )   )   );

    });

    $('#print-nav').click(function(){
        H2P.init();
    });

    $('#web-nav').click(function(){
        if(H2P.isInitialized()){
            H2P.remove();
        }
    });



};
