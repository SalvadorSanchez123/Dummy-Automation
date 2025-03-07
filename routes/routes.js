import express from 'express';
import zip_diff from '../controllers/zip-diff.controller.js';

// routes
const router = new express.Router();



// login (future)
// router.get('/', auth.getLoginPage);
// router.post('/login', passport.authenticate('local', {
//     successRedirect: '/',
//     failureRedirect: '/login',
//     failureFlash: true,//this message has to be setup
// }));

// temp landing page for Zip compare
router.get('/zip', zip_diff.getZipDiffPage);
router.post('/zip/upload', zip_diff.uploadZips);
// router.get('/zip/output/prerun', zip_diff.getPreRunPage);//be able to delete if not right and re
// router.get('/zip/output/running', zip_diff.getRunningPage);
router.post('/zip/delete', zip_diff.deleteZips);
router.post('/zip/execute', zip_diff.executeComparison);
router.get('/zip/download/:filename', zip_diff.downloadOutput);


// Exports
export default router;