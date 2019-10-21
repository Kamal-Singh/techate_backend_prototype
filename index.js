const   app = require('express')(),
        bodyParser = require('body-parser'),
        multer = require('multer'),
        fs = require('fs'),
        path = require('path'),
        {spawn} = require('child_process')

        
//------------Setting Parameters-------------------
const PORT = process.env.PORT || 3000;
const DOWNLOAD_PATH = path.join(__dirname,'/uploads/images/')
const ENCODING_PATH = path.join(__dirname,'/data/')

app.use(bodyParser.urlencoded({extended: true}));

// Setting Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // console.log("file uploaded")
      cb(null, DOWNLOAD_PATH)
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.'+ file.originalname.split('.')[1])
    }
})
const upload = multer({ dest: DOWNLOAD_PATH, storage: storage })
   

// Setting Python Spawn
create_encoding_script = function(file_path,save_path,person_name) {
  return spawn('python3', ["-u",  path.join(__dirname, './scripts/create_encodings.py'),
  file_path,save_path,person_name] )
}

check_image_script = function(file_path,encodings_path) {
  return spawn('python3', ["-u", path.join(__dirname,'./scripts/check_image.py'),
  file_path,encodings_path], { stdio:[null,null,null,'ipc'] } );
}

//---------------ROUTES-----------------
app.get('/',function(req,res) {
    res.sendFile(__dirname + '/index.html');
})

// Uploading Image
app.post('/uploadperson', upload.single('image'),(req,res,next) => {
    // console.log(req)
    const file = req.file
    if(!file)
    {
      const error = new Error("File Not Uploaded")
      error.httpStausCode = 400
      return next(error)
    }
    console.log("writing encoding")
    let filename = req.body.name;
    let save_path = path.join(__dirname,'./data/')
    const subprocess = create_encoding_script(file.path,save_path,filename)
    subprocess.stdout.on('data', (data) => {
      console.log(`${data}`);
    });
    subprocess.stderr.on('data', (data) => {
      console.log(`error:${data}`);
    });
    subprocess.stderr.on('close', () => {
      console.log("Spawn Completed");
    });
    res.send(file)
})

// Testing Image for Known Person
app.post('/uploadimage', upload.single('image'), (req,res,next) => {
    const file = req.file
    if(!file)
    {
      const error = new Error("File Not Uploaded")
      error.httpStausCode = 400
      return next(error)
    }
    // console.log("Found Image");
    let file_path = file.path
    let faces = []
    const subprocess = check_image_script(file_path,ENCODING_PATH)
    subprocess.stdout.on('data', (data) => {
      console.log(`${data}`);
      tmp = `${data}`;
      faces.push(tmp);
    });
    subprocess.stderr.on('data', (data) => {
      console.log(`error:${data}`);
    });
    subprocess.stderr.on('close', () => {
      console.log("Spawn Completed");
      faces = faces.map((i) => { return i.replace(/\n|\r/g, ""); });
      console.log(faces);
    });
    res.send(file);
})

app.listen(PORT,(req,res) => console.log(`The Server is running on http://localhost:${PORT}`))
