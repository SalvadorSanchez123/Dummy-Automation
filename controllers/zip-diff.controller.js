// Monthly diff CSV generator from two uploaded ZIP files
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn, spawnSync } from 'child_process';
// import { get } from 'https';
//import unzipper 

// import { PrismaClient } from '@prisma/client';
// import fetch from 'node-fetch';
// import dayjs from 'dayjs';
// import isoWeek from 'dayjs/plugin/isoWeek.js';
// dayjs.extend(isoWeek);

const uploadDir = './file_loads/zip_uploads/';
const outputDir = './file_loads/csv_output/';

// to get all files in upload folder
const getFiles = () => {
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return fs.readdirSync(uploadDir);
}
const getOutputs = () => {
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return fs.readdirSync(outputDir);
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        let newFileName = "NONE";
        if (file?.originalname) {
            let nowDate = new Date(Date.now());
            let year = nowDate.getFullYear();
            let month = nowDate.getMonth() + 1;
            let day = nowDate.getDate();
            let dateStr = `${month}-${day}-${year}`;
            let portionOfOriginalName = file.originalname.slice(0,-4);
            newFileName = file.fieldname + '--' + portionOfOriginalName + "--" + dateStr + path.extname(file.originalname);
            let filesToDelete = getFiles().filter(file => file.includes(portionOfOriginalName));
            filesToDelete.forEach( file => {
                fs.unlink(path.join(uploadDir, file), (err) => {
                    if (err) {
                        res.send("Failed to delete files");
                    }
                });
            });
        }
        cb(null, newFileName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      checkFileType(file, cb);
    }
}).fields(
    [
        {
            name: 'prevZip', maxCount: 1
        },
        {
            name: 'currZip', maxCount: 1
        }
    ]
);

const checkFileType = (file, cb) => {
    const filetypes = /zip/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // const mimetype = filetypes.test(file.mimetype);
  
    if (extname) {/// && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: zips Only!');
    }
}

const getZipDiffPage = async (req, res) => {
    let nowDate = new Date(Date.now());
            let year = nowDate.getFullYear();
            let month = nowDate.getMonth() + 1;
            let day = nowDate.getDate();
    console.log("year " + year + ", month " + month + ", date " + day);
    console.log("time: " + nowDate.toLocaleString().split(",")[1].trim())
    console.log("Zip Page Newly Loaded " + new Date(Date.now()).toLocaleDateString());
    res.render("zip-diff", { files: getFiles(), outputFiles: getOutputs() });
}

const uploadZips = async (req, res) => {
    console.log("Started Zip Upload");
    console.log('start time: ... ' + new Date(Date.now()).toLocaleDateString());
    upload(req, res, err => {
        if (err) {
            console.log("ERROR Zip Upload");
            console.log(err);
            console.log('End time: ... ' + new Date(Date.now()).toLocaleDateString());
            res.send(`failed to upload files ... ${err}`);
        }
        else {
            console.log("Success Zip Upload");
            console.log('End time: ... ' + new Date(Date.now()).toLocaleDateString());
            res.redirect("/zip");
        }
    });
}

const deleteZips = async (req, res) => {
    let uploadedFiles = getFiles();
    uploadedFiles.forEach( file => {
        fs.unlink(path.join(uploadDir, file), (err) => {
            if (err) {
                res.send("Failed to delete files");
            }
        });
    });

    setTimeout(() => {
        res.redirect("/zip");
    }, 1000);
}

const executeComparison = async (req, res) => {
    // delete previous output files
    let outputFiles = getOutputs();
    outputFiles.forEach( file => {
        fs.unlink(path.join(outputDir, file), (err) => {
            if (err) {
                res.send("Failed to delete files");
            }
        });
    });

    const minCash = req.body.minCash;
    const maxCash = req.body.maxCash;
    const minShares = req.body.minShares;
    const maxShares = req.body.maxShares;
    const state = req.body.state;

    const oldZip = getFiles().find((file) => file.includes('prev'));
    const newZip = getFiles().find((file) => file.includes('curr'));

    const parsePythonProcess = spawn('python', ['./python_code/zip_parsing/run-cython-parse.py', oldZip, newZip, minCash, maxCash, minShares, maxShares, state]);
    // const parsePythonProcess = spawn('python', ['./python_code/zip_parsing/zipparse.py', oldZip, newZip, minCash, maxCash, minShares, maxShares, state]);

    parsePythonProcess.stdout.on('data', (data) => {
        console.log('data: ' + data);
    });

    parsePythonProcess.stderr.on('data', (err) => {
        console.log("Error Data: " + err);
    });

    parsePythonProcess.on('close', (exitCode) => {
        console.log(`Exit Code from Python: ${exitCode}`);
        res.redirect("/zip");
    });
    // setTimeout(() => {
    //     res.redirect("/zip");
    // }, 5000);
}

const downloadOutput = async (req, res) => {
    const fileName = req.params.filename;
    const filePath = outputDir + fileName;

    res.download(filePath, fileName, err => {
        if (err) {
            res.send({
                error: err,
                msg: "Problem downloading the file"
            });
        }
    });
}

export default {
    getZipDiffPage,
    uploadZips,
    executeComparison,
    deleteZips,
    downloadOutput
}