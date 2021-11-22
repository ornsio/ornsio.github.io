// handle messages from the main thread
onmessage = function( event ) {
    console.log( 'Worker ' + event.data.worker + ' : Message received from main thread: ' + JSON.stringify( event.data ) );

    var text    = event.data.text;
    var matcher = event.data.searchRegEx;

    var isMatch = false;
    var matchedText = '';
    if ( matcher.test( text ) )
    {
        isMatch = true;
        matcher.lastIndex = 0;
        matchedText = text.replaceAll( matcher, '<b>$&</b>' );
    }

    postMessage({
        id : event.data.id,
        rowMatched : isMatch,
        text : matchedText,
        worker : event.data.worker
    });
}