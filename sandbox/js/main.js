if ( window.Worker ) {
    const worker = new Worker( 'js/worker.js' );

    worker.onmessage = function( event ) {
        console.log( 'Worker sent main thread a message: ' + event.data );
    }

    function buttonClick() {
        worker.postMessage( 'This is a message from the main thread.' );
        console.log( 'Main thread sent worker a message.' );
    }
}
else {
    alert( "Your browser doesn't support web workers, so this page won't work for you :-(" );
}