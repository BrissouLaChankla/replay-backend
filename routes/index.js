var express = require('express');
var router = express.Router();
const cloudinary = require('cloudinary').v2;

const fs = require('fs')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});


const Player = require('../models/Player')
const Tag = require('../models/Tag')
const Video = require('../models/Video')


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/latest/:nbOfFetch', function (req, res, next) {
  Video.find({}).sort('-date').skip(req.params.nbOfFetch * 6).limit(7).populate("players").populate("tags").then(videos => {
    if (videos.length < 7) {
      res.json({ videos: videos.slice(0, 6), lastFetch: true })
    } else {
      res.json({ videos: videos.slice(0, 6), lastFetch: false })
    }
  })

});

router.post('/filter', function (req, res, next) {

});

router.get('/playerNTags', async (req, res) => {
  try {

    const [players, tags] = await Promise.all([
      Player.find({}),
      Tag.find({})
    ]);

    res.json({ players, tags });
  } catch (error) {

    res.status(500).send(error.message);

  }
});

router.post('/store', async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.files || !req.files.uploaded_file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const players = [];
    const tags = [];

    for (const key in req.body) {
      if (key.includes('player_')) {
        players.push(key.slice(7));
      } else if (key.includes('tag_')) {
        tags.push(key.slice(4));
      }
    }

    const photoPath = `./tmp/${req.files.uploaded_file.name}`;
    await req.files.uploaded_file.mv(photoPath);

    const resultCloudinary = await cloudinary.uploader.upload(photoPath, {
      resource_type: "video",
    });

    fs.unlinkSync(photoPath);

    // Consider adding code to delete the temporary file here

    const newVideo = new Video({
      src: resultCloudinary.secure_url,
      date: new Date(),
      title: req.body.title,
      tags,
      players,
    });

    const newVid = await newVideo.save();
    res.json({ newVid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});


module.exports = router;
