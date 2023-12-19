function decode() {
    var input = document.getElementById( 'userText' ).value;

    // There's no \r in browser textareas, even on windows, and even when copy/pasted
    var textArray = input.split( '\n' );
    var decodeArray = [];

    for ( var i = 0; i < textArray.length; i++ ) {
        try {
            var decoded = atob( textArray[i] );
        }
        catch (e) {
            alert( 'The input string on row ' + (i+1) + ' is not a valid base64 encoded string.' );
            throw e;
        }
        decodeArray.push( decoded );
    }

    document.getElementById( 'output' ).innerHTML = decodeArray.join( "<br />" );
}

function encode() {
    var input = document.getElementById( 'userText' ).value;

    // There's no \r in browser textareas, even on windows, and even when copy/pasted
    var textArray = input.split( '\n' );
    var encodeArray = [];

    for ( var i = 0; i < textArray.length; i++ ) {
        var encoded = btoa( textArray[i] );
        encodeArray.push( encoded );
    }

    document.getElementById( 'output' ).innerHTML = encodeArray.join( "<br />" );
}

function selectOutput() {
    window.getSelection().selectAllChildren(
        document.getElementById( 'output' )
    );
}