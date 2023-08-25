const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
// const multerS3 = require('multer-s3-transform');
const awsConfig = require('../config/s3.config');
const dotenv = require('dotenv');
dotenv.config();

AWS.config.update(awsConfig);

const s3 = new AWS.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            cb(null, `${Date.now()}_${file.originalname}`);
        },
    }),
});

module.exports = upload;