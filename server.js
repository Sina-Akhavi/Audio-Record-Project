const fs = require('fs');
const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        const fileNameArr = file.originalname.split('.');
        cb(null, `${Date.now()}.${fileNameArr[fileNameArr.length - 1]}`);
    },
});
const upload = multer({ storage });


app.set('view engine', 'ejs');
app.use(express.static('uploads'));
app.use(express.static('public'));
app.use(express.json());

const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
    fs.readFile('./public/db.json', (err, dataString) => {
        let db = JSON.parse(dataString);
        
        res.render('page_2', db);
    });
});

app.get('/get-data', (req, res) => {
    fs.readFile('./public/db.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            res.send(data);
        }
    });
});

app.post('/save-class', (req, res) => {
    const newClass = req.body.newClass;

    const path = './public/db.json';
    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const dataJson = JSON.parse(data);
            dataJson.classNames.push(newClass);
            write(path, dataJson);
        }
        res.json({
            status: 'success'
        });
    });
})

app.get('/update-class', (req, res) => {
    const data = JSON.parse(req.query.data);
    write('./public/db.json', data);
});

app.post('/record', upload.single('audio'), (req, res) => {
    console.log(req.body);
    res.json({ success: true })
});

app.get('/recordings', (req, res) => {
    let files = fs.readdirSync(path.join(__dirname, 'uploads'));
    files = files.filter((file) => {
        // check that the files are audio files
        const fileNameArr = file.split('.');
        return fileNameArr[fileNameArr.length - 1] === 'mp3';
    }).map((file) => `/${file}`);
    return res.json({ success: true, files });
});

app.post('/add-sound', (req, res) => {
    const trackName = req.body.nameTrack;
    const classTrack = req.body.classTrack;

    const files = fs.readdirSync(path.join(__dirname, 'uploads'));
    const id = files[files.length - 1].split('.')[0];
    const createdDate = calCurrentDate();

    const newTrack = {name: trackName, class: classTrack, id: id, createdDate: createdDate};
    fs.readFile('./public/db.json', (err, dataString) => {
        const jsonData = JSON.parse(dataString);
        const tracks = jsonData.tracks;
        tracks.push(newTrack);

        write('./public/db.json', jsonData);
        res.send(jsonData);
    });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

function calCurrentDate() {
    const dateObj = new Date();
    const date = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
    const time = `${dateObj.getHours()}:${dateObj.getMinutes()}`;
    return date + '  ' + time;
}

function write(path, jsonData) {
    fs.writeFile(path, JSON.stringify(jsonData, null, 2), err => {
        if (err) {
            console.log(err);
        }
    });
}
