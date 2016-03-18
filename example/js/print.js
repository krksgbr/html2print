







H2P.doAfterLayout(function(){
    $('p').each(function(index){
        var entropy = 0.1 * index;
        $(this).css('letter-spacing', entropy+'mm');
    });
});