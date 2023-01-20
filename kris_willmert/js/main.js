const qsp = new URLSearchParams( window.location.search );

if ( qsp.has( "emphasis" ) ) {
    const emph = qsp.get( "emphasis" );

    let defaultPrintNote   = document.getElementById( "printNoteDefault" );
    let defaultExpButton   = document.getElementById( "expButton4" );
    let defaultExpContent  = document.getElementById( "expContent4" );
    let defaultSkills      = document.getElementById( "skillsDefault" );

    let ellucianPrintNote  = document.getElementById( "printNoteEllucian" );
    let ellucianExpButton  = document.getElementById( "expButton2" );
    let ellucianExpContent = document.getElementById( "expContent2" );
    let ellucianSkills     = document.getElementById( "skillsEllucian" );

    switch ( emph ) {
        case "ellucian":
            defaultPrintNote.classList.add( "d-none" );
            defaultExpButton.classList.add( "collapsed" );
            defaultExpContent.classList.remove( "show" );
            defaultSkills.classList.add( "d-none" );

            ellucianPrintNote.classList.remove( "d-none" );
            ellucianExpButton.classList.remove( "collapsed" );
            ellucianExpContent.classList.add( "show" );
            ellucianSkills.classList.remove( "d-none" );

            break;
    }
}

$.get("./si/1.html",function(data){$('#item1').html(atob(data))},);
$.get("./si/2.html",function(data){$('#item2').html(atob(data))},);