const recordingsContainer = document.getElementById('play-boxes-container');
let chunks = [];
let mediaRecorder = null;
let audioBlob = null; 
var data = null;
getData();
var browsBtn = document.querySelector('input[type=file]');

setTimeout(createHTMLForTracks, 2000);

function saveClass() {
    const newClassName = document.getElementById('class-name').value;
    if (newClassName == '') {
        alert("Name field cannot be empty.");
        return;
    }

    data.classNames.push(newClassName);
    updateHTMLClasses();
    updateHTMLsForSelectElements();
    const newData = {newClass: newClassName};
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData)
    };

    fetch('/save-class', options)
    .then(res => console.log(res))
    .catch(err => {
        console.log(err);
    });
}

function updateHTMLClasses() {
    const classNames = data.classNames;
    let html = `
        Class Types
        <button class="btn add-class-btn" onclick="showPopup()"> Add Class </button><br><br><br>
        
        <input type="checkbox" id="all">
        <label for="all"> All <br><br><br> </label>
        
        <input type="search" class="search-margin" placeholder="search text" name="search-text" id="search-text"> `
    
    for (let i = 0; i < classNames.length; i++) {
        html += `<input type="checkbox" id="${classNames[i]}" value="${classNames[i]}"
        <label for="${classNames[i]}"> ${classNames[i]} <br><br><br> </label>`;
    }

    document.getElementsByClassName('borders class-type-section')[0].innerHTML = html;
}

function setDurationsOfAudios() {
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
        audio.onloadedmetadata = function() {
            const duration = audio.duration;
            console.log(duration);
            const elementOfDuration = audio.nextElementSibling.nextElementSibling;
            elementOfDuration.innerHTML = standardize(duration);
        }
    });
}

function standardize(seconds) {
    const duration = Math.round(seconds);
    const secondsInMinute = 60;

    if (duration < secondsInMinute) {
        if (duration >= 10) {
            return `00:${duration}`
        } else {
            return `00:0${duration}`
        }
    } else {
        const minutesOfDuration = Math.floor(duration / secondsInMinute);
        const secondsOfDuration = duration % secondsInMinute;
        
        if (secondsOfDuration >= 10) {
            return `0${minutesOfDuration}:${secondsOfDuration}`;
        } else {
            return `0${minutesOfDuration}:0${secondsOfDuration}`;
        }
    }
}

function createHTMLForTracks() {
    let html = "";
    const tracks = data.tracks;
    const classNames = data.classNames;
    for (let i = 0; i < tracks.length; i++) {
        html += `<div class="row">
        <div class="play-box">
          <audio src="/${tracks[i].id}.mp3" preload="metadata"></audio>
          <small style="font-size: 18px;">${tracks[i].name} </small>
          <small style="float:right; font-size:18px;"></small><br><br>
          <button class="play-button"><i class=
            "fa fa-play play-pause-margin"></i></button>
        </div>
        <select name="select-${i}" id="select-${i}" class="level">
          <option value="${tracks[i].class}">${tracks[i].class}</option>`;

        for (let j = 0; j < classNames.length; j++) {
            if (tracks[i].class !== classNames[j]) { 
                html += `<option value="${classNames[j]}">${classNames[j]}</option>`;
            }  
        }
        html += `</select>
        <div class="datetime">${tracks[i].createdDate}</div>
        <div class="dropdown">
          <div class="more-sign"></div>
          <div class="dropdown-content">
            <a href="#">link 1</a>
            <a href="#">link 2</a>
            <a href="#">link 3</a>
            </div>
            </div>
            </div>
            `;
        }
        document.getElementById('play-boxes-container').innerHTML = html;
        setDurationsOfAudios();

        setEvents();
        setEventsForPlayButtons();
}

function setEvents() {


    document.querySelector('.save-button').addEventListener('click', saveClass);
    document.getElementById('aRecord').addEventListener('click', record);
    let i = 0;
    while (document.getElementById(`select-${i}`) != null) {
        document.getElementById(`select-${i}`).addEventListener('change', updateDataBaseDataObject);
        i += 1;
    }
    
    const elements = document.querySelectorAll("input[type=checkbox]");
    for (let i = 2; i < elements.length; i++) {
        elements[i].addEventListener('change', filterPlayBoxes);
    }
    
    document.getElementById('all').addEventListener('change', checkAll);
    document.getElementById('save_new_sound').onclick = saveRecording;
    document.getElementById('upload').addEventListener('click', browseForUpload);
    browsBtn.addEventListener('change', createBlobUploadFile);

}

function createBlobUploadFile() {
    const uploadedFile = browsBtn.files[0];
    audioBlob = uploadedFile;

    showNewSoundPopup();
}

function browseForUpload() {
    browsBtn.click();
}

function filterPlayBoxes() {
    const allClasses = document.querySelectorAll("input[type=checkbox]");
    const tickedClasses = [];
    for (let i = 2; i < allClasses.length; i++) {
        if (allClasses[i].checked) {
            tickedClasses.push(allClasses[i].value);
        }
    }

    const filteredTracks = [];

    data.tracks.forEach(track => {
        if (tickedClasses.includes(track.class)) { 
            filteredTracks.push(track);
        }
    });

    recordingsContainer.innerHTML = "";
    let index = -1;
    filteredTracks.forEach(filteredTrack => {
        index += 1;
        const div = createRecordingElement(filteredTrack, index);
        recordingsContainer.appendChild(div);
    });
    setDurationsOfAudios();
    setEvents();
    setEventsForPlayButtons();
}

function updateDataBaseDataObject(event) {
    const selectElement = event.target;
    
    const relatedAudio = selectElement.parentElement.children[0].children[0];
    let trackFileName = relatedAudio.src;
    const trackId = trackFileName.substring(22, trackFileName.length - 4);
    console.log(trackFileName);
    const newClassValue = selectElement.value;
    
    const dataObjectTrack = data.tracks.filter(track => {
        return track.id == trackId;
    })[0];
    
    dataObjectTrack.class = newClassValue;
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/update-class?data=` + JSON.stringify(data));
    xhr.send();
}

function getData() {
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
        let db = this.responseText;
        data = JSON.parse(db);
    }

    xhr.open('GET', '/get-data');
    xhr.send();
}

function updateHTMLsForSelectElements() {
    let htmlForSelectOptions = "";
    
    const elements = document.getElementsByClassName('row');

    for (let i = 0; i < elements.length; i++) {
        const selectedOptionValue = elements[i].children[1].value;
        htmlForSelectOptions += `<option value=${selectedOptionValue}>${selectedOptionValue}</option>`; // error is here.
        
        for (let j = 0; j < data.classNames.length; j++) {
            if (selectedOptionValue != data.classNames[j]) {
                htmlForSelectOptions += `<option value="${data.classNames[j]}"> ${data.classNames[j]} </option>`;
            }
        }

        elements[i].children[1].innerHTML = htmlForSelectOptions;
        htmlForSelectOptions = "";
    }   
    htmlForSelectOptions = "";
    for (let i = 0; i < data.classNames.length; i++) {
        htmlForSelectOptions += `<option value="${data.classNames[i]}"> ${data.classNames[i]} </option>`;
    }
    document.getElementById('track-class').innerHTML = htmlForSelectOptions;
}

function checkAll(event) {
    const allOption = event.target;
    const allOptionChecked = allOption.checked; 
    
    const checkBoxInputs = document.querySelectorAll('input[type=checkbox]');

    for (let i = 1; i < checkBoxInputs.length; i++) {
        checkBoxInputs[i].checked = allOptionChecked;
    }
    filterPlayBoxes();
}  

function showPopup() {
    document.getElementById('popupId').style.display = "block";
    document.getElementById('overlayer').style.display = "block"
}

function closePopup() {
    document.getElementById('popupId').style.display = "none"
    document.getElementById('overlayer').style.display = "none"
    document.getElementsByClassName('overlayer_2')[0].style.display = "none";
}

function showSaveInfoPopup() {
    document.getElementsByClassName('overlayer_2')[0].style.display = "block";
}

function showNewSoundPopup() {
    document.getElementsByClassName('overlayer_2')[0].style.display = 'block'
}

function mediaRecorderDataAvailable(e) {
    chunks.push(e.data);
    audioBlob = new Blob(chunks, { type: 'audio/mp3' });
}

function record() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support recording!');
      return;
    }
  
    document.getElementById('upload').style.display = 'none';
    const recordStopBtn = document.getElementById('aRecord');
    recordStopBtn.innerHTML = "STOP";
    recordStopBtn.addEventListener('click', stopRecording);

    if (!mediaRecorder) {
      navigator.mediaDevices.getUserMedia({
        audio: true,
      })
        .then((stream) => {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();
          if (document.getElementById('record-stop-auto').checked) {
              const duration = document.querySelector('input[type=number]').value;
              setTimeout(stopRecording, duration * 1000);
          }
          mediaRecorder.ondataavailable = mediaRecorderDataAvailable;
          mediaRecorder.onstop = showNewSoundPopup;
        })
        .catch((err) => {
          alert(`The following error occurred: ${err}`);
        });
    } 
}

function stopRecording() {
    mediaRecorder.stop();
}
  
function resetRecording() {
    document.getElementsByClassName('borders top-border')[0].innerHTML = 
    `<button class="btn" id="upload"> Upload file </button>
    <button class="btn record-btn" id="aRecord" onclick="record()"> Record Now </button>`;

    audioBlob = null;
    mediaRecorder = null;
    chunks = [];
}
  
function playRecording(e) {
    const clickedEl = e.target;

    let iconEl = null;
    let audio = null;

    if (clickedEl.tagName == "I") {
        iconEl = clickedEl;
        audio = clickedEl.parentElement.parentElement.children[0];
    } else {
        iconEl = clickedEl.children[0];
        audio = clickedEl.parentElement.children[0];
    }

    if (audio && audio.tagName === 'AUDIO') {
        audio.onended = function() {
            iconEl.classList.replace('fa-pause', 'fa-play');
        };
        if (audio.paused) {
            iconEl.classList.replace('fa-play', 'fa-pause');
            audio.play();
      } else {
            iconEl.classList.replace('fa-pause', 'fa-play');
            audio.pause();
            
      }
    }
}
  
function createRecordingElement(file, index) { 
    let fileUploadName = null;
    if (file.id == undefined) { // so file is a String
        fileUploadName = file.substring(1, file.length);
        fileUploadName = fileUploadName.split('.')[0]
    } else {
        fileUploadName = file.id;
    }
    
    
    console.log(data.tracks); // error detected
    const targetTracks = data.tracks.filter(track => {
        
        return track.id == fileUploadName;
    });

    const targetTrack = targetTracks[0];

    const div = document.createElement('div');
    let nameSel = `select-${index}`;
    let idSel = `select-${index}`;

    div.classList.add('row');

    let html = `
          <div class="play-box">
            <audio src="/${fileUploadName}.mp3"></audio>
            <small style="font-size: 18px;"> ${targetTrack.name} </small>
            <small style="float: right; font-size:18px;"></small><br><br>
            <button class="play-button"><i class="fa fa-play play-pause-margin"></i></button>
          </div>
          <select name=${nameSel} id=${idSel} class="level">`;
      
        let options = `<option value=${targetTrack.class}> ${targetTrack.class} </option>`;
        data.classNames.forEach(className => {
            if (targetTrack.class !== className) {
                options += `<option value=${className}> ${className} </option>`;
            }
        });
        html += options;
 
          html +=`</select>        
          <div class="datetime">${targetTrack.createdDate}</div>
          <div class="dropdown">
            <div class="more-sign"></div>
            <div class="dropdown-content">
              <a href="#">link 1</a>
              <a href="#">link 2</a>
              <a href="#">link 3</a>
            </div>
          </div>
      `;

      div.innerHTML = html;
      return div;
}

function fetchRecordings() {
    fetch('/recordings')    
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        if (response.success && response.files) {
            recordingsContainer.innerHTML = ''; // remove all children
            let index = -1;
            console.log(response.files);
            response.files.forEach((file) => {
                index += 1;
                const recordingElement = createRecordingElement(file, index);
                recordingsContainer.appendChild(recordingElement);
        });
            setEventsForPlayButtons();
            setEvents();
            setDurationsOfAudios();
        }
      })
      .catch((err) => {
          return console.error(err);
        });
}
  
function setEventsForPlayButtons() {
    const playButtons = document.querySelectorAll('button[class=play-button]');
    playButtons.forEach(playButton => {
        playButton.addEventListener('click', playRecording);
    })
}
  
function saveRecording() {
    const trackName = document.getElementById('track-name').value;
    const trackClass = document.getElementById('track-class').value;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.mp3');
    fetch('/record', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        return response.json();
      })
      .then(() => {
        alert('Your recording is saved');
        resetRecording();
        // fetchRecordings();
      })
      .catch((err) => {
        console.error(err);
        alert('An error occurred, please try again later');
        resetRecording();
      });

      options = {
        method: 'POST',
        body: JSON.stringify({
          nameTrack: trackName,
          classTrack: trackClass
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      }

      fetch('/add-sound', options)
      .then(response => {
        return response.json();
      }).then(res => {
        data = res;
        fetchRecordings();
      }).catch(err => {
        console.log(err);
      });
}
