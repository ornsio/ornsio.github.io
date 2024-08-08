var timerList = [];
var freeSlots = [];
var deletedTimers = [];

var globalOutFileName = "";

var optionsShown = true; // Options window is visible/open
var confirmReset = true; // Confirm on reset/"stop"
var confirmClear = true; // Confirm on clear
var confirmDelete = true; // Confirm on delete
var autoStartNewTimer = false; // Automatically start timing new timers
var onlyAllowOneTiming = false; // Only one timer timing allowed at a time

var deletedTimerCacheSize = 20;

if ( JSON.parse( localStorage.getItem( 'optionsStored' ) ) ) {
    optionsShown = JSON.parse( localStorage.getItem( 'optionsShown' ) );
    confirmReset = JSON.parse( localStorage.getItem( 'confirmReset' ) );
    confirmClear = JSON.parse( localStorage.getItem( 'confirmClear' ) );
    confirmDelete = JSON.parse( localStorage.getItem( 'confirmDelete' ) );
    autoStartNewTimer = JSON.parse( localStorage.getItem( 'autoStartNewTimer' ) );
    onlyAllowOneTiming = JSON.parse( localStorage.getItem( 'onlyAllowOneTiming' ) );
}

function hideOptions() {
    optionsShown = false;
    document.getElementById( 'options' ).style.display = 'none';
}

function showOptions() {
    optionsShown = true;
    document.getElementById( 'options' ).style.display = 'block';
}


function Timer( id, lastStartIn, savedTimeIn, pausedIn, titleIn, notesIn, prevLastStartIn, prevSavedTimeIn ) {
    var self = this;
    
    this.timerId       = id;
    this.lastStart     = null;
    this.savedTime     = 0;
    this.paused        = true;
    this.interval      = null;
    this.title         = 'New Timer';
    this.notes         = '';
    this.prevLastStart = null;
    this.prevSavedTime = null;
    
    if ( lastStartIn ) {
        this.lastStart = lastStartIn;
    }
    
    if ( savedTimeIn ) {
        this.savedTime = savedTimeIn;
    }
    
    if ( pausedIn === false ) {
        this.paused = pausedIn;
    }
    
    if ( titleIn ) {
        this.title = titleIn;
    }
    
    if ( notesIn ) {
        this.notes = notesIn;
    }

    if ( prevLastStartIn ) {
        this.prevLastStart = prevLastStartIn;
    }

    if ( prevSavedTimeIn ) {
        this.prevSavedTime = prevSavedTimeIn;
    }

    this.totalTime = function() {
        var time = self.savedTime;
        if ( !self.paused ) {
            time += getNow() - self.lastStart;
        }
        return time;
    };

    this.getTime = function() {
        var time = this.totalTime();
        var msec = ('00' + (time % 1000)).slice(-3);
        time = Math.floor(time / 1000);
        
        var sec = ( '0' + (time % 60) ).slice(-2);
        time = Math.floor(time / 60);
        
        var min = ( '0' + (time % 60) ).slice(-2);
        time = Math.floor(time / 60);

        return time + ':' + min + ':' + sec;
    };

    this.start = function() {
        if ( onlyAllowOneTiming ) {
            pauseAll();
        }

        this.removeEditable();
      
        if ( this.lastStart ) {
            var now = getNow();
            var stopTime = now - this.lastStart;
            
            var msec = ('00' + (stopTime % 1000)).slice(-3);
            stopTime = Math.floor(stopTime / 1000);
            
            var sec = ( '0' + (stopTime % 60) ).slice(-2);
            stopTime = Math.floor(stopTime / 60);
            
            var min = ( '0' + (stopTime % 60) ).slice(-2);
            stopTime = Math.floor(stopTime / 60);
            
            var thisInfoBox = document.getElementById( 'infoBox'+this.timerId );
            thisInfoBox.innerHTML = 'Timer was paused for ' + stopTime + ':' + min + ':' + sec;
            thisInfoBox.classList.add( 'timerInfoVisible' );
            setTimeout( function() { thisInfoBox.classList.remove( 'timerInfoVisible' ); }, 10000 );
        }
        
        this.lastStart = getNow();
        this.interval = setInterval( this.refresh, 1000 );
        this.paused = false;
        document.getElementById( 'timerText'+this.timerId ).classList.add( 'timerActive' );
        document.getElementById( 'btnPausePlay'+this.timerId ).title = 'Pause';
        document.getElementById( 'btnPausePlay'+this.timerId ).innerHTML = ';';
        updateTitle();
    };
    
    this.saveTime = function() {
        if ( !this.paused ) {
            var now = getNow();
            this.savedTime += now - this.lastStart;
            this.lastStart = now;
        }
    };
    
    this.pause = function() {
        this.saveTime();
        clearInterval( this.interval );
        this.paused = true;
        document.getElementById( 'timerText'+this.timerId ).classList.remove( 'timerActive' );
        document.getElementById( 'btnPausePlay'+this.timerId ).title = 'Resume';
        document.getElementById( 'btnPausePlay'+this.timerId ).innerHTML = '4';
        this.refresh();
        this.makeEditable();
        updateTitle();
    };
    
    this.setTime = function( timeValue ) {
        if ( !this.paused ) {
            return;
        }
        this.prevLastStart = this.lastStart;
        this.prevSavedTime = this.savedTime;
        this.savedTime = timeValue;
    };

    this.reset = function() {
        var wasRunning = false;

        if ( !this.paused ) {
            this.pause();
            wasRunning = true;
        }

        this.prevLastStart = this.lastStart;
        this.prevSavedTime = this.savedTime;

        if ( wasRunning ) {
            this.lastStart = getNow();
        }
        
        this.savedTime = 0;
        clearInterval( this.interval );
        document.getElementById( 'timerText'+this.timerId ).classList.remove( 'timerActive' );
        document.getElementById( 'btnPausePlay'+this.timerId ).title = 'Start';
        document.getElementById( 'btnPausePlay'+this.timerId ).innerHTML = '4';
        this.refresh();
        updateTitle();
    };
    
    this.refresh = function() {
        var time = self.savedTime;
        if ( !self.paused ) {
            time += getNow() - self.lastStart;
        }
        var msec = ('00' + (time % 1000)).slice(-3);
        time = Math.floor(time / 1000);
        
        var sec = ( '0' + (time % 60) ).slice(-2);
        time = Math.floor(time / 60);
        
        var min = ( '0' + (time % 60) ).slice(-2);
        time = Math.floor(time / 60);
        
        document.getElementById( 'timerText'+self.timerId ).innerHTML = time + ':' + min + ':' + sec;
        
        refreshTotal();
    };
    
    this.makeEditable = function () {
        $('#timerText' + self.timerId).editable({
            closeOnEnter: true,
            callback: function (data) {
                if (data.content) {
                    var pattern = /^([0-9]+):([0-9]{2})(?::([0-9]{2}))?$/;
                    if (pattern.test(data.content)) {
                        var matches = pattern.exec(data.content);
                        var hrs = matches[1] * 1;
                        var min = matches[2] * 1;
                        var sec = (matches[3] || 0) * 1;

                        if (min < 60 && sec < 60) {
                            self.setTime( (hrs * 3600 + min * 60 + sec) * 1000 );
                        }
                    }
                    else {
                        console.error('Invalid time format. Use 0:00:00');
                    }
                }
                self.refresh();
            }
        });		
    };

    this.removeEditable = function () {
        $('#timerText' + self.timerId).editable('destroy');
    };
    
    this.init = function () {
        // Create timer row
        var newTimer = document.createElement( 'tr' );
        newTimer.id = 'timer' + this.timerId;
        newTimer.className = 'timer';
        

        // Create timer clock, append to row
        var timerText = document.createElement( 'td' );
        timerText.id = 'timerText' + this.timerId;
        timerText.className = 'timerCell timerText';
        newTimer.appendChild( timerText );


        // Create timer conrols, append to row
        var timerControls = document.createElement( 'td' );
        timerControls.id = 'timerControls' + this.timerId;
        timerControls.className = 'timerCell timerControls';
        newTimer.appendChild( timerControls );
        

        // Create timer control buttons, append to timer controls
        //
        // Pause/Play button
        var btnPausePlay = document.createElement( 'div' );
        btnPausePlay.id = 'btnPausePlay' + this.timerId;
        btnPausePlay.className = 'timerButton buttonFont1';
        btnPausePlay.title = 'Start';
        btnPausePlay.innerHTML = '4';
        btnPausePlay.addEventListener(
            'click',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 12 );
                
                if ( timerList[timerRef].paused ) {
                    timerList[timerRef].start();
                }
                else {
                    timerList[timerRef].pause();
                }
                
                savePageState();
            },
            true
        );
        timerControls.appendChild( btnPausePlay );
        
        // Reset button
        var btnReset = document.createElement( 'div' );
        btnReset.id = 'btnReset' + this.timerId;
        btnReset.className = 'timerButton buttonFont1';
        btnReset.title = 'Reset';
        btnReset.innerHTML = '<';
        btnReset.addEventListener(
          'click',
          function( evnt ) {
              var timerRef = evnt.currentTarget.id.substring( 8 );
              var doIt = false;
              
              if ( !timerList[timerRef].paused || timerList[timerRef].savedTime > 0 ) {
                  if ( confirmReset ) {
                      doIt = confirm( "Do you really want to reset timer " + timerList[timerRef].title + "?" );
                  }
                  else {
                      doIt = true;
                  }
              }
              
              if ( doIt ) {
                  timerList[timerRef].reset();
                  savePageState();
              }
            },
            true
        );
        timerControls.appendChild( btnReset );

        // Undo reset button
        var btnUndo = document.createElement( 'div' );
        btnUndo.id = 'btnUndo' + this.timerId;
        btnUndo.className = 'timerButton buttonFont2';
        btnUndo.title = 'Undo Last Reset';
        btnUndo.innerHTML = 'O';
        btnUndo.addEventListener(
            'click',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 7 );
                var doIt = confirm( "Do you want to undo the last Reset of this timer?\n\nTimer will be restored to the value it had the last time you reset it, and the current time will be lost." );

                if ( doIt ) {
                    timerList[timerRef].pause();
                    timerList[timerRef].lastStart = timerList[timerRef].prevLastStart;
                    timerList[timerRef].savedTime = timerList[timerRef].prevSavedTime;
                    timerList[timerRef].refresh();
                    timerList[timerRef].prevLastStart = null;
                    timerList[timerRef].prevSavedTime = null;
                }
            }
        );
        timerControls.appendChild( btnUndo );
        
        // Decrement ("dock") time button
        var btnDockMin = document.createElement( 'div' );
        btnDockMin.id = 'btnDockMin' + this.timerId;
        btnDockMin.className = 'timerButton buttonFont1';
        btnDockMin.title = '-1 minute';
        btnDockMin.innerHTML = '9';
        btnDockMin.addEventListener(
            'click',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 10 );
                timerList[timerRef].saveTime();
                
                if ( evnt.ctrlKey ) {
                    timerList[timerRef].savedTime -= 900000;
                }
                else if ( evnt.shiftKey ) {
                    timerList[timerRef].savedTime -= 3600000;
                }
                else {
                    timerList[timerRef].savedTime -= 60000;
                }
                
                if ( timerList[timerRef].savedTime < 0 ) {
                    timerList[timerRef].savedTime = 0;
                }
                
                timerList[timerRef].refresh();
                savePageState();
            },
            true
        );
        timerControls.appendChild( btnDockMin );

        // Increment ("bump") time button
        var btnBumpMin = document.createElement( 'div' );
        btnBumpMin.id = 'btnBumpMin' + this.timerId;
        btnBumpMin.className = 'timerButton buttonFont1';
        btnBumpMin.title = '+1 minute';
        btnBumpMin.innerHTML = ':';
        btnBumpMin.addEventListener(
            'click',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 10 );
                
                if ( evnt.ctrlKey ) {
                    timerList[timerRef].savedTime += 900000;
                }
                else if ( evnt.shiftKey ) {
                    timerList[timerRef].savedTime += 3600000;
                }
                else {
                    timerList[timerRef].savedTime += 60000;
                }
                
                timerList[timerRef].refresh();
                savePageState();
            },
            true
        );
        timerControls.appendChild( btnBumpMin );
        
        // Clear timer button
        var btnClearTimer = document.createElement( 'div' );
        btnClearTimer.id = 'btnClearTimer' + this.timerId;
        btnClearTimer.className = 'timerButton buttonFont1';
        btnClearTimer.title = 'Clear';
        btnClearTimer.innerHTML = '`';
        btnClearTimer.addEventListener(
            'click',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 13 );
                var doIt = false;
                
                if ( !timerList[timerRef].paused || timerList[timerRef].savedTime > 0 || timerList[timerRef].title != 'New Timer' || timerList[timerRef].notes != '' ) {
                    if ( confirmClear ) {
                        doIt = confirm( "Do you really want to clear timer " + timerList[timerRef].title + "?\n\nCurrent time, title, and notes will all be lost!" );
                    }
                    else {
                        doIt = true;
                    }
                }
                
                if ( doIt ) {
                    timerList[timerRef].reset();
                    timerList[timerRef].title = 'New Timer';
                    document.getElementById( 'titleBox' + timerRef ).value = 'New Timer';
                    timerList[timerRef].notes = '';
                    document.getElementById( 'noteBox' + timerRef ).value = '';
                    savePageState();
                }
            },
            true
        );
        timerControls.appendChild( btnClearTimer );
        
        // Delete timer button
        var btnDelTimer = document.createElement( 'div' );
        btnDelTimer.id = 'btnDelTimer' + this.timerId;
        btnDelTimer.className = 'timerButton buttonFont1';
        btnDelTimer.title = 'Delete';
        btnDelTimer.innerHTML = 'x';
        btnDelTimer.addEventListener(
            'click',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 11 );
                var doIt = true;
                
                if ( confirmDelete ) {
                    doIt = confirm( "Do you really want to delete timer " + timerList[timerRef].title + "?\n\nCurrent time, title, and notes will all be lost!" );
                }
                
                if ( doIt ) {
                    removeTimer( timerRef );
                    savePageState();
                }
            },
            true
        );
        timerControls.appendChild( btnDelTimer );
        
        
        // Create timer label, append to row
        var timerLabel = document.createElement( 'td' );
        timerLabel.id = 'timerLabel' + this.timerId;
        timerLabel.className = 'timerCell timerLabel';
        newTimer.appendChild( timerLabel );

        // Create label input box, append to label cell
        var titleBox = document.createElement( 'input' );
        titleBox.id = 'titleBox' + this.timerId;
        titleBox.className = 'timerTitle';
        titleBox.type = 'text';
        titleBox.value = this.title;
        titleBox.addEventListener(
            'keyup',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 8 );
                timerList[timerRef].title = evnt.currentTarget.value;
                updateTitle();
                savePageState();
            }
        );
        timerLabel.appendChild( titleBox );

        // Create info display div, append to label cell
        var infoBox = document.createElement( 'div' );
        infoBox.id = 'infoBox' + this.timerId;
        infoBox.className = 'timerInfo';
        timerLabel.appendChild( infoBox );
        
        // Create notes cell, append to row
        var timerNotes = document.createElement( 'td' );
        timerNotes.id = 'timerNotes' + this.timerId;
        timerNotes.className = 'timerCell timerNotes';
        newTimer.appendChild( timerNotes );

        var noteBox = document.createElement( 'textarea' );
        noteBox.id = 'noteBox' + this.timerId;
        noteBox.className = 'timerTextarea';
        noteBox.rows = '2';
        noteBox.value = this.notes;
        noteBox.addEventListener(
            'keyup',
            function( evnt ) {
                var timerRef = evnt.currentTarget.id.substring( 7 );
                timerList[timerRef].notes = evnt.currentTarget.value;
                savePageState();
            }
        );
        timerNotes.appendChild( noteBox );


        document.getElementById( 'timerTable' ).appendChild( newTimer );
        
        autosize( document.getElementById( 'noteBox' + this.timerId ) );
        
        if ( !this.paused ) {
            //this.start(); - can't use this cause it will re-set lastStart, which we don't want when
            //                re-initializing a saved timer from a previous session
            this.interval = setInterval( this.refresh, 1000 );
            document.getElementById( 'timerText'+this.timerId ).classList.add( 'timerActive' );
            document.getElementById( 'btnPausePlay'+this.timerId ).title = 'Pause';
            document.getElementById( 'btnPausePlay'+this.timerId ).innerHTML = ';';
        }
        else if ( autoStartNewTimer && this.lastStart == null && this.title == 'New Timer' ) {
            this.start();
        }
        else {
            this.makeEditable();
        }

        this.refresh();
    };
};


// Add a new timer to the page
function addTimer( genericTimerObject ) {
    var id = 0;
    
    if ( freeSlots.length != 0 ) {
        id = freeSlots.shift();
    }
    else {
        id = timerList.length;
    }
    
    if ( genericTimerObject ) {
        genericTimerObject.id = id;
        restoredTimer = new Timer(
            genericTimerObject.id,
            genericTimerObject.lastStart,
            genericTimerObject.savedTime,
            genericTimerObject.paused,
            genericTimerObject.title,
            genericTimerObject.notes,
            genericTimerObject.prevLastStart,
            genericTimerObject.prevSavedTime
        );
        timerList[id] = restoredTimer;    
    }
    else {
        timerList[id] = new Timer( id );
    }
    timerList[id].init();
}

// Restore the last deleted timer
function undoLastDelete() {
    var lastDeletedTimer = deletedTimers.pop();

    if ( lastDeletedTimer ) {
        addTimer( lastDeletedTimer );
    }
}

// Remove the specified timer from the page
function removeTimer( id, skipUndo ) {
    if ( !timerList[id].paused ) {
        timerList[id].pause();
    }

    if ( !skipUndo ) {
        deletedTimers.push( JSON.parse( JSON.stringify( timerList[id] ) ) );

        // If we have exceeded the cache size, remove the oldest item
        if ( deletedTimers.length > deletedTimerCacheSize ) {
            deletedTimers.shift();
        }
    }
    
    if ( id < (timerList.length - 1) ) {
        timerList[id] = 'free';
        freeSlots.push( id );
    }
    else {
        timerList.splice( id, 1 );
    }
    
    var timer = document.getElementById( 'timer'+id );
    
    timer.parentNode.removeChild( timer );
    
    refreshTotal();
}

// Refresh the total time displayed in the header
function refreshTotal() {
    var totalTime = 0;
    
    for ( var i = 0; i < timerList.length; i++ ) {
        if ( timerList[i] != 'free' ) {
            totalTime += timerList[i].totalTime();
        }
    }
    
    var totalMsec = ('00' + (totalTime % 1000)).slice(-3);
    totalTime = Math.floor(totalTime / 1000);
    
    var totalSec = ( '0' + (totalTime % 60) ).slice(-2);
    totalTime = Math.floor(totalTime / 60);
    
    var totalMin = ( '0' + (totalTime % 60) ).slice(-2);
    totalTime = Math.floor(totalTime / 60);
    
    document.getElementById( 'totalTime' ).innerHTML = totalTime + ':' + totalMin + ':' + totalSec;
}

// Update the page title based on the running timers
function updateTitle() {
    var titleList = [];
    
    for ( var i = 0; i < timerList.length; i++ ) {
        if ( timerList[i] instanceof Timer && !timerList[i].paused ) {
            titleList.push( timerList[i].title );
        }
    }
    
    if ( titleList.length ) {
        if ( titleList.length > 1 ) {
            var lastElement = titleList.pop();
            document.title = '[' + titleList.join('], [') + '] and [' + lastElement +'] currently timing - Tracker';
        }
        else {
            document.title = '[' + titleList[0] + '] currently timing - Tracker';
        }
    }
    else {
        document.title = 'Tracker';
    }
}

// Boolean for if at least one timer is running or not
function isRunningTimer() {
    var runningTimerFound = false;
    
    for ( var i = 0; i < timerList.length && !runningTimerFound; i++ ) {
        if ( timerList[i] instanceof Timer && !timerList[i].paused ) {
            runningTimerFound = true;
        }
    }
    
    return runningTimerFound;
}


// Pause all running timers
function pauseAll() {
    for ( var i = 0; i < timerList.length; i++ ) {
        if ( timerList[i] instanceof Timer && !timerList[i].paused ) {
            timerList[i].pause();
        }
    }
}

// Reset all timers to 0
function resetAll() {
    var doIt = confirm( "Do you really want to reset ALL timers to 0:00:00?" );
    
    if ( doIt ) {
        for ( var i = 0; i < timerList.length; i++ ) {
            if ( timerList[i] instanceof Timer ) {
                timerList[i].reset();
            }
        }
    }
}

// Delete all timers
function deleteAll() {
    var doIt = confirm( "Do you really want to DELETE ALL timers and start over?\n\nAll of your current timer titles, notes, and times will be lost forever!" );
    
    if ( doIt ) {
        for ( var i = 0; i < timerList.length; i++ ) {
            if ( timerList[i] instanceof Timer ) {
                removeTimer( i, true );
            }
        }
        
        timerList     = [];
        freeSlots     = [];
        deletedTimers = [];
        
        addTimer();
    }
}

// Show/hide the different download options
function showDownloadOptions() {
    document.getElementById( 'downloadOptions' ).style.display = 'block';
}
function hideDownloadOptions() {
    document.getElementById( 'downloadOptions' ).style.display = 'none';
}

// Download all timer data to a CSV file
function downloadToCsv( isAppendStyle = false ) {
    var csvText;

    if ( isAppendStyle ) {
        csvText = parseTimerData( true, true );
    }
    else {
        csvText = 'Time,Label,Notes,"Note that multi-line text in Notes may be present, but (in Excel) you need to expand the vertical row size to see it."' + "\n";
        csvText += parseTimerData();
        csvText += "\nTotal Time:," + document.getElementById( 'totalTime' ).innerHTML;
    }

    saveCsv( csvText );
}

// Append the current timers to an existing CSV file (have to load and recreate the file since browser JS can't actually do a file append)
function appendFile() {
    var file = userFile.files[0];
    globalOutFileName = file.name;
    file.text().then( text => parseForAppend( text.split( '\n' ) ) );
}
function parseForAppend( textArray ) {
    textArray.push( parseTimerData( true, false ) );
    var csvText = textArray.join( "\n" );
    saveCsv( csvText, globalOutFileName );
}

// Parse timer data for the CSV output functions
function parseTimerData( isAppendStyle = false, includeTitleLine = false ) {
    var timerText = "";

    if ( isAppendStyle ) {
        var titleLine = [];
        var thisLine = [];

        var today = new Date();
        var todayString = String( today.getMonth() + 1 ) + '/' + String( today.getDate() );
        thisLine.push( csvEscape( todayString ) );

        if ( includeTitleLine ) {
            titleLine.push( csvEscape( "Date" ) );
        }

        for ( var i = 0; i < timerList.length; i++ ) {
            var currentTimer = timerList[i];
            
            thisLine.push( csvEscape( currentTimer.getTime() ) );
            thisLine.push( csvEscape( currentTimer.notes ) );

            if ( includeTitleLine ) {
                titleLine.push( csvEscape( "Time" ) );
                titleLine.push( csvEscape( currentTimer.title ) );
            }
        }

        if ( includeTitleLine ) {
            timerText += titleLine.join( ',' ) + "\n";
        }
        timerText += thisLine.join( ',' );
    }
    else {
        for ( var i = 0; i < timerList.length; i++ ) {
            var currentTimer = timerList[i];
            var thisLine = [];
    
            thisLine.push( csvEscape( currentTimer.getTime() ) );
            thisLine.push( csvEscape( currentTimer.title ) );
            thisLine.push( csvEscape( currentTimer.notes ) );
    
            timerText += thisLine.join( ',' ) + "\n";
        }
    }

    return timerText;
}

// Save the given text to a CSV file
function saveCsv( csvText, fileName = "" ) {
    var today = new Date();
    var tempDownloadAnchor = document.createElement( 'a' );
    tempDownloadAnchor.href = 'data:text/csv;charset=utf-8,' + encodeURI( csvText );
    tempDownloadAnchor.target = '_blank';

    if ( fileName == "" ) {
        fileName = String( today.getMonth() + 1 ).padStart( 2, '0' ) + '-' + String( today.getDate() ).padStart( 2, '0' ) + '.csv';
    }

    tempDownloadAnchor.download = fileName;
    tempDownloadAnchor.click();
}

// Properly escape a string for inclusion as a field in a CSV
function csvEscape( input ) {
    var output = input;

    if ( output.indexOf( '"' ) > -1 ) {
        output = output.replaceAll( '"','""' );
    }

    // Even when quoted, Excel still annoyingly thinks a cell starting with a - is a formula...
    output = output.replace( /(^|\n)-/g, '$1*' );

    output = '"' + output + '"';

    return output;
}


// Init the page from browser storage
function initializePage( evnt ) {
    var savedTimers = JSON.parse( localStorage.getItem( 'savedTimers' ) );
    var savedDeletedTimers = JSON.parse( localStorage.getItem( 'deletedTimers' ) );
    
    if ( savedTimers ) {
        var id = 0;
        
        for ( var i = 0; i < savedTimers.length; i++ ) {
            if ( savedTimers[i] != 'free' ) {
                var lastStart = savedTimers[i]['lastStart'];
                var savedTime = savedTimers[i]['savedTime'];
                var paused = savedTimers[i]['paused'];
                var title = savedTimers[i]['title'];
                var notes = savedTimers[i]['notes'];
                var prevLastStart = savedTimers[i]['prevLastStart'];
                var prevSavedTime = savedTimers[i]['prevSavedTime'];
                
                timerList[id] = new Timer( id, lastStart, savedTime, paused, title, notes, prevLastStart, prevSavedTime );
                timerList[id].init();
                
                id++;
            }
        }
    }

    if ( savedDeletedTimers ) {
        deletedTimers = savedDeletedTimers;
    }
    
    if ( timerList.length == 0 ) {
        addTimer();
    }
    else {
        updateTitle();
    }
    
    if ( optionsShown ) {
        showOptions();
    }
    
    document.getElementById( 'promptReset' ).checked = confirmReset;
    document.getElementById( 'promptClear' ).checked = confirmClear;
    document.getElementById( 'promptDelete' ).checked = confirmDelete;
    document.getElementById( 'autoStart' ).checked = autoStartNewTimer;
    document.getElementById( 'onlyOneRunning' ).checked = onlyAllowOneTiming;
}

// Save the page's current state to browser storage
function savePageState() {
    if ( timerList.length > 0 ) {
        localStorage.setItem( 'savedTimers', JSON.stringify( timerList ) );
    }
    else {
        localStorage.removeItem( 'savedTimers' );
    }

    if ( deletedTimers.length > 0 ) {
        localStorage.setItem( 'deletedTimers', JSON.stringify( deletedTimers ) );
    }
    else {
        localStorage.removeItem( 'deletedTimers' );
    }
    
    localStorage.setItem( 'optionsStored', JSON.stringify( true ) );
    localStorage.setItem( 'optionsShown', JSON.stringify( optionsShown ) ); // Options window is visible/open
    localStorage.setItem( 'confirmReset', JSON.stringify( confirmReset ) ); // Confirm on reset/"stop"
    localStorage.setItem( 'confirmClear', JSON.stringify( confirmClear ) ); // Confirm on clear
    localStorage.setItem( 'confirmDelete', JSON.stringify( confirmDelete ) ); // Confirm on delete
    localStorage.setItem( 'autoStartNewTimer', JSON.stringify( autoStartNewTimer ) ); // Automatically start timing new timers
    localStorage.setItem( 'onlyAllowOneTiming', JSON.stringify( onlyAllowOneTiming ) ); // Only one timer timing allowed at a time
}

function getNow() {
    return new Date().valueOf();
}

// On unload, save the page state
window.addEventListener(
    'unload',
    function( evnt ) {
        savePageState();
    }
);