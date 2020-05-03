require('dotenv/config');
const express = require('express');

const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const axios = require('axios');

const multer = require('multer');
const AWS = require('aws-sdk');
// const uuid = require('uuid');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001;
var cron = require('node-cron');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, '');
  },
});

const upload = multer({ storage }).single('image');

app.post('/upload', upload, (req, res, next) => {
  let myFile = req.file.originalname.split('.');
  const fileType = myFile[myFile.length - 1];
  //   console.log(req.file, 'file');
  //   res.send({
  //     message: 'Image upload',
  //   });

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}.${fileType}`,
    Body: req.file.buffer,
  };
  s3.upload(params, (error, data) => {
    if (error) {
      res.status(500).send(error);
    }
    res.status(200).send(data);
  });
});
// app.get('/', (req, res, next) => {
//   res.send({
//     message: `Server running on port ${port}`,
//   });
// });

apiCall = (pdate) => {
  let symbol = 'AAPL';
  let date = pdate;
  // let timestamp = '';
  // let timestampLimit = '';
  const key = process.env.POLYGON_KEY;
  // let timestamp = null;
  let limit = 10000;
  const url = `https://api.polygon.io/v2/ticks/stocks/trades/${symbol}/${date}?limit=${limit}&apiKey=${key}&reverse=1`;
  return (
    axios
      .get(url)
      // .then((response) => {
      //   console.log(res.data, 'search data');
      // })
      .then((response) => {
        return response.data.results;
        //   console.log(Array.from(response.data.results), 'response');
      })
      .catch((error) => {
        return (error = 'no data found for the day');
        console.log(error);
      })
  );
};
async function dateRange() {
  const start = moment('2019-01-01', 'YYYY-MM-DD');

  const end = moment('2019-01-05', 'YYYY-MM-DD');
  const range = moment.range(start, end);
  //   const data = [];
  const fileType = 'json';
  for (let day of range.by('day')) {
    // console.log(day.format('YYYY-MM-DD'));
    result = await apiCall(day.format('YYYY-MM-DD'));
    var dayfile = day.format('YYYY-MM-DD');

    // console.log(result, 'result');
    // data.push(...result);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${dayfile}.${fileType}`,
      Body: JSON.stringify(result),
    };
    await s3.upload(params, (error, data) => {
      if (error) {
        console.log(error);
        // res.status(500).send(error);
      }
      //   res.status(200).send(data);
      console.log('success');
    });
  }
  //   console.log(data, data.length, 'total data');
}
dateRange();

// cron.schedule('*/20 * * * * *', () => {
//   apiCall();
// });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
