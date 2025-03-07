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
const getFiles = () => fs.readdirSync(uploadDir);
const getOutputs = () => fs.readdirSync(outputDir);

// Set up storage engine
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        let newFileName = "";
        if (file?.originalname) {
            let portionOfOriginalName = file.originalname.slice(-11,-4);
            newFileName = file.fieldname + '-' + portionOfOriginalName + '-' + Date.now() + path.extname(file.originalname);
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
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
    res.render("zip-diff", { files: getFiles(), outputFiles: getOutputs() });
}

const uploadZips = async (req, res) => {
    // req.socket.setTimeout(10 * 60 * 1000);
    // upload(req, res, err => {
    //     if (err) {
    //         res.send(`failed to upload files ... ${err}`);
    //     }
    //     else {
    //         res.redirect("/zip");
    //     }
    // });

    console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
    console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
    console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
    console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
    console.log('start time: ... ' + Date.now());
    upload(req, res, err => {
        if (err) {
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log('End time: ... ' + Date.now());
            res.send(`failed to upload files ... ${err}`);
        }
        else {
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log("0000000000000000000000000000000000000000000000000000000000000000000000");
            console.log('End time: ... ' + Date.now());
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

    const oldZip = getFiles().find((file) => file.includes('prev'));
    const newZip = getFiles().find((file) => file.includes('curr'));

    const parsePythonProcess = spawn('python', ['./python_code/zip_parsing/run-cython-parse.py', oldZip, newZip, minCash, maxCash, minShares, maxShares]);

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